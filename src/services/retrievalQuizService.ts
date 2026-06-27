import { toDateKey } from '../lib/dates'
import {
  allocateRetrievalSlots,
  applyRetrievalToProgress,
  tallyRetrievalByLesson,
  RETRIEVAL_QUIZ_SIZE,
} from '../lib/retrieval'
import { collectTemplates, generatePracticeForLesson } from './practiceEngine'
import { getMasteryProfile, getWeakConcepts } from './masteryProfileService'
import { getMasteryStatus } from './masteryService'
import { ensureLessonProgress, saveLessonProgress } from './progressService'
import { setLastRetrievalQuizDate } from './userService'
import { getLessonMetadata, isLessonAvailable } from '../types/lessonMetadata'
import type { Question } from '../types/lesson'
import type { LessonProgress, MasteryStatus, SkillCheckAnswer } from '../types/progress'

/**
 * Daily spaced-retrieval quiz service (I/O layer).
 *
 * The deterministic decisions — which lessons get how many slots, how a quiz is tallied, and how a
 * result folds into a lesson's progress — live in `src/lib/retrieval.ts` and are unit-tested there.
 * This module wires those decisions to Firestore and to the existing validated question generator
 * (`practiceEngine`), so correctness of the questions stays with the deterministic math engine.
 */

/** A built quiz: the ordered questions plus a map from each question id to its source lesson. */
export interface RetrievalQuiz {
  questions: Question[]
  /** questionId -> lessonId, so graded answers can be tallied back to the right lesson. */
  questionLessonMap: Record<string, string>
}

/** Per-lesson outcome of one recorded quiz, for the results screen (Phase 4). */
export interface RetrievalLessonOutcome {
  lessonId: string
  questionsPresented: number
  questionsCorrect: number
  passedRetrievalSession: boolean
  /** Effective mastery after recording (null only if the lesson has no skill check yet). */
  masteryLevel: MasteryStatus | null
  /** True when this quiz is what tipped the lesson into Mastered. */
  promotedToMastered: boolean
}

export interface RetrievalResultsSummary {
  date: string
  lessons: RetrievalLessonOutcome[]
}

/** Completed, playable lessons in lesson order — the pool the quiz interleaves across. */
function orderedCompletedLessonIds(progressByLesson: Record<string, LessonProgress>): string[] {
  return Object.values(progressByLesson)
    .filter((progress) => progress.completed && isLessonAvailable(progress.lessonId))
    .sort(
      (a, b) =>
        (getLessonMetadata(a.lessonId)?.lessonOrder ?? 0) -
        (getLessonMetadata(b.lessonId)?.lessonOrder ?? 0),
    )
    .map((progress) => progress.lessonId)
}

/**
 * Lesson-level weakness score = how many of a lesson's concepts the learner is currently weak on
 * (from the concept-level Mastery Profile). Drives how the extra quiz slots are biased toward
 * struggling lessons. Strong lessons score 0 but still keep their base slot (so they aren't
 * forgotten). Loads each lesson's authored templates to discover the concepts it covers.
 */
async function computeWeaknessByLesson(
  userId: string,
  lessonIds: string[],
): Promise<Record<string, number>> {
  const profile = await getMasteryProfile(userId)
  const weakConcepts = new Set<string>(getWeakConcepts(profile).map((stat) => stat.concept))

  const weaknessByLesson: Record<string, number> = {}
  await Promise.all(
    lessonIds.map(async (lessonId) => {
      const templates = await collectTemplates(lessonId)
      const lessonConcepts = new Set<string>(templates.flatMap((t) => t.conceptTags ?? []))
      weaknessByLesson[lessonId] = [...lessonConcepts].filter((tag) => weakConcepts.has(tag)).length
    }),
  )
  return weaknessByLesson
}

/**
 * Round-robin the per-lesson question batches so the quiz interleaves concepts (lesson 1 Q, lesson 2
 * Q, lesson 3 Q, lesson 1 Q, ...) instead of grouping a lesson's questions together. Deterministic.
 */
function interleaveByLesson(
  batches: { lessonId: string; questions: Question[] }[],
): Question[] {
  const queues = batches.map((batch) => [...batch.questions])
  const interleaved: Question[] = []
  let progressed = true
  while (progressed) {
    progressed = false
    for (const queue of queues) {
      const next = queue.shift()
      if (next) {
        interleaved.push(next)
        progressed = true
      }
    }
  }
  return interleaved
}

/**
 * Build today's 5-question retrieval quiz for the learner.
 *
 * - Pool = lessons whose questions are completed (interleaved across all of them).
 * - Slot allocation biases extra questions toward lessons with weak concepts (Mastery Profile),
 *   while every completed lesson keeps at least one slot.
 * - Each question is a validated parameter variation of an authored template, produced by the
 *   existing `generatePracticeForLesson` pipeline (AI/local variation + deterministic validation,
 *   with an authored-question fallback when a template can't be varied).
 *
 * Returns no questions when the learner hasn't completed any lesson yet.
 */
export async function buildRetrievalQuiz(
  userId: string,
  progressByLesson: Record<string, LessonProgress>,
): Promise<RetrievalQuiz> {
  const completedLessonIds = orderedCompletedLessonIds(progressByLesson)
  if (completedLessonIds.length === 0) {
    return { questions: [], questionLessonMap: {} }
  }

  const weaknessByLesson = await computeWeaknessByLesson(userId, completedLessonIds)
  const slots = allocateRetrievalSlots(completedLessonIds, weaknessByLesson, RETRIEVAL_QUIZ_SIZE)

  const questionLessonMap: Record<string, string> = {}
  let idCounter = 0

  const batches = await Promise.all(
    completedLessonIds.map(async (lessonId) => {
      const count = slots[lessonId] ?? 0
      if (count <= 0) {
        return { lessonId, questions: [] as Question[] }
      }
      // Reuses the validated generator: it targets the learner's weak concepts, validates every
      // variant with the math engine, and tops up with authored questions if needed.
      const generated = await generatePracticeForLesson(userId, lessonId, count)
      const questions = generated.map((question) => {
        const id = `retrieval-${lessonId}-${(idCounter += 1)}`
        questionLessonMap[id] = lessonId
        return { ...question, id }
      })
      return { lessonId, questions }
    }),
  )

  const interleaved = interleaveByLesson(batches).map((question, index) => ({
    ...question,
    order: index,
  }))

  return { questions: interleaved, questionLessonMap }
}

/** Marks the daily quiz as shown today (taken or skipped), gating it to once per calendar day. */
export async function markRetrievalQuizShown(userId: string, now: Date = new Date()): Promise<void> {
  await setLastRetrievalQuizDate(userId, toDateKey(now))
}

/**
 * Record a completed retrieval quiz. Each lesson is updated INDEPENDENTLY: its slice of the answers
 * is tallied, folded into its own progress (history, successful-day count, mastery snapshot), and
 * saved. Also stamps the once-per-day gate. Returns a per-lesson summary for the results screen.
 */
export async function recordRetrievalResults(
  userId: string,
  questionLessonMap: Record<string, string>,
  answers: SkillCheckAnswer[],
  now: Date = new Date(),
): Promise<RetrievalResultsSummary> {
  const tallies = tallyRetrievalByLesson(questionLessonMap, answers)

  const lessons: RetrievalLessonOutcome[] = []
  for (const tally of tallies) {
    const existing = await ensureLessonProgress(userId, tally.lessonId)
    const before = getMasteryStatus(existing)
    const updated = applyRetrievalToProgress(existing, tally, now)
    await saveLessonProgress(updated)
    const after = getMasteryStatus(updated)

    lessons.push({
      lessonId: tally.lessonId,
      questionsPresented: tally.questionsPresented,
      questionsCorrect: tally.questionsCorrect,
      passedRetrievalSession: tally.passedRetrievalSession,
      masteryLevel: after,
      promotedToMastered: before !== 'mastered' && after === 'mastered',
    })
  }

  await markRetrievalQuizShown(userId, now)

  return { date: toDateKey(now), lessons }
}
