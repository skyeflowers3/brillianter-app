import { toDateKey } from './dates'
import { countSuccessfulRetrievalDays, getMasteryStatus } from '../services/masteryService'
import type { LessonProgress, RetrievalSession, SkillCheckAnswer } from '../types/progress'
import type { UserProfile } from '../types/user'

/**
 * Pure logic for the daily spaced-retrieval quiz.
 *
 * Everything here is deterministic and side-effect free (no Firestore, no Math.random, no Date.now
 * unless a `now` is passed in) so it can be unit-tested in isolation. The service layer is
 * responsible for I/O: reading the mastery profile, generating/validating the actual questions, and
 * persisting the results.
 */

/** The first lesson — the daily quiz never appears until this lesson's questions are completed. */
export const FIRST_LESSON_ID = 'lesson-1'

/** Questions per daily retrieval quiz. */
export const RETRIEVAL_QUIZ_SIZE = 5

/** A lesson's retrieval slice passes when at least this fraction of ITS questions are correct. */
export const RETRIEVAL_PASS_THRESHOLD = 0.8

/** A lesson's tallied result for one quiz, before it is stamped with a calendar date. */
export type RetrievalTally = Omit<RetrievalSession, 'date'>

/**
 * Whether the learner should be shown the daily retrieval quiz right now.
 *
 *   - No quiz until the first lesson's questions are completed.
 *   - At most one quiz per calendar day: gated by the user's `lastRetrievalQuizDate`, which the
 *     caller stamps with today's key when the quiz is shown (taken OR skipped).
 */
export function isRetrievalQuizDue(
  profile: Pick<UserProfile, 'lastRetrievalQuizDate'> | null | undefined,
  progressByLesson: Record<string, LessonProgress>,
  now: Date = new Date(),
): boolean {
  if (!progressByLesson[FIRST_LESSON_ID]?.completed) {
    return false
  }
  return (profile?.lastRetrievalQuizDate ?? null) !== toDateKey(now)
}

/**
 * Decide how many of the quiz's `total` questions come from each completed lesson.
 *
 * Interleaving: every completed lesson gets at least one slot whenever they fit (`L <= total`); when
 * there are more completed lessons than slots, the weakest lessons are prioritized.
 *
 * Spaced bias: any leftover slots (`total - L`) are handed out weakest-first (round-robin in
 * descending `weaknessByLesson` order), so struggling lessons get reviewed more — while stronger
 * lessons still keep their base slot so they aren't forgotten.
 *
 * Returns a `lessonId -> count` map whose counts sum to `total` (or fewer only if there are no
 * completed lessons). Deterministic for a given input.
 */
export function allocateRetrievalSlots(
  completedLessonIds: string[],
  weaknessByLesson: Record<string, number>,
  total: number = RETRIEVAL_QUIZ_SIZE,
): Record<string, number> {
  const slots: Record<string, number> = {}
  if (completedLessonIds.length === 0 || total <= 0) {
    return slots
  }

  // Weakest (highest weakness) first; ties keep the caller's order (Array.prototype.sort is stable).
  const ordered = [...completedLessonIds].sort(
    (a, b) => (weaknessByLesson[b] ?? 0) - (weaknessByLesson[a] ?? 0),
  )

  // Base allocation: one slot per lesson, capped at `total` (weakest lessons win when they overflow).
  let assigned = 0
  for (const lessonId of ordered) {
    if (assigned >= total) {
      break
    }
    slots[lessonId] = 1
    assigned += 1
  }

  // Distribute any remaining slots weakest-first, cycling through the lessons that got a base slot.
  const eligible = ordered.filter((lessonId) => slots[lessonId] !== undefined)
  for (let i = 0; assigned < total && eligible.length > 0; i += 1) {
    const lessonId = eligible[i % eligible.length]
    slots[lessonId] += 1
    assigned += 1
  }

  return slots
}

/**
 * Group graded quiz answers by lesson and decide, per lesson, whether that lesson's retrieval slice
 * passed (>= `RETRIEVAL_PASS_THRESHOLD` of its own questions correct). Answers whose question id is
 * not in `questionLessonMap` are ignored. Returns one tally per lesson that had >=1 question.
 */
export function tallyRetrievalByLesson(
  questionLessonMap: Record<string, string>,
  answers: SkillCheckAnswer[],
): RetrievalTally[] {
  const byLesson = new Map<string, { presented: number; correct: number }>()

  for (const answer of answers) {
    const lessonId = questionLessonMap[answer.questionId]
    if (!lessonId) {
      continue
    }
    const entry = byLesson.get(lessonId) ?? { presented: 0, correct: 0 }
    entry.presented += 1
    if (answer.correct) {
      entry.correct += 1
    }
    byLesson.set(lessonId, entry)
  }

  return [...byLesson.entries()].map(([lessonId, { presented, correct }]) => ({
    lessonId,
    questionsPresented: presented,
    questionsCorrect: correct,
    passedRetrievalSession: presented > 0 && correct / presented >= RETRIEVAL_PASS_THRESHOLD,
  }))
}

/**
 * Fold one lesson's retrieval result into its progress: stamp the tally with today's date, append it
 * to `retrievalHistory`, recompute the distinct successful-day count, refresh `lastRetrievalDate`,
 * and update the denormalized `masteryLevel` snapshot to match the live `getMasteryStatus` value
 * (which stays null when no skill check has been taken yet). Pure — returns a new progress object.
 */
export function applyRetrievalToProgress(
  progress: LessonProgress,
  tally: RetrievalTally,
  now: Date = new Date(),
): LessonProgress {
  const session: RetrievalSession = { date: toDateKey(now), ...tally }
  const retrievalHistory = [...(progress.retrievalHistory ?? []), session]

  const next: LessonProgress = {
    ...progress,
    retrievalHistory,
    successfulRetrievalSessions: countSuccessfulRetrievalDays(retrievalHistory),
    lastRetrievalDate: session.date,
  }

  // Keep the denormalized snapshot in lock-step with the authoritative read. Only set it when a
  // status actually exists (a skill check has been taken), so we never write a status — or a
  // Firestore `undefined` — before one is earned.
  const level = getMasteryStatus(next)
  if (level) {
    next.masteryLevel = level
  }

  return next
}
