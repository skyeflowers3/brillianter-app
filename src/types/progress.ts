import type { QuestionInteractionState } from './lesson'

export interface QuestionHistoryEntry {
  questionId: string
  correct: boolean
  attempts: number
  /** @deprecated Use submittedState. Kept for older saved progress. */
  submittedTip?: [number, number]
  submittedState?: QuestionInteractionState
}

export interface SkillCheckAnswer {
  questionId: string
  correct: boolean
}

export interface SkillCheckResult {
  score: number
  total: number
  answers: SkillCheckAnswer[]
}

export interface SkillCheckHistoryEntry {
  completedAt: string
  score: number
  total: number
  answers: SkillCheckAnswer[]
}

/**
 * One lesson's slice of a single daily retrieval quiz. Retention is tracked per lesson, not per
 * quiz: each lesson that appears in the day's quiz records its own session with how many of ITS
 * questions were presented/correct and whether that slice passed (>=80%).
 */
export interface RetrievalSession {
  /** Calendar day of the quiz, 'YYYY-MM-DD' (local), so spaced sessions are counted by distinct days. */
  date: string
  lessonId: string
  questionsPresented: number
  questionsCorrect: number
  /** True when this lesson's slice was answered at >=80% accuracy. */
  passedRetrievalSession: boolean
}

/**
 * Lesson mastery tier.
 *
 * `mastered` now represents demonstrated long-term retention (a Proficient lesson that has passed
 * three spaced retrieval sessions on three different days), NOT just a strong skill-check score. A
 * skill check on its own tops out at `proficient`.
 */
export type MasteryStatus = 'mastered' | 'proficient' | 'needs_review'

export interface LessonProgress {
  userId: string
  lessonId: string
  completed: boolean
  currentQuestionIndex: number
  questionsAnswered: number
  correctAnswers: number
  incorrectAnswers: number
  questionHistory: QuestionHistoryEntry[]
  skillCheckCompleted: boolean
  /** Left absent until a skill check is recorded so Firestore never receives undefined. */
  skillCheckScore?: number
  skillCheckHistory: SkillCheckHistoryEntry[]
  /** True after submit until the learner clicks Continue */
  awaitingContinue: boolean
  /** Score from the most recent skill-check attempt. Absent until a skill check is recorded. */
  latestSkillCheckScore?: number
  /** Best skill-check score across all attempts — mastery is based on this, not the latest. */
  highestSkillCheckScore?: number
  /** Number of skill-check attempts completed for this lesson. */
  skillCheckAttempts: number
  /** Mastery tier from the highest score. Absent until a skill check is recorded. */
  masteryStatus?: MasteryStatus
  /**
   * True once the learner has, after a Needs Review score, completed the personalized review AND
   * then retaken the skill check. This is what unlocks the next lesson regardless of the retake
   * score (so they can never get permanently stuck). Set when a skill check is recorded while
   * `remediationCompleted` is already true.
   */
  requiredRetakeCompleted: boolean
  /**
   * True once the learner has finished the personalized review (remediation practice) for this
   * lesson. On its own this does NOT unlock the next lesson — they must still retake the skill check
   * afterward — but it marks that the review half of the requirement is done.
   */
  remediationCompleted?: boolean
  /**
   * Per-lesson record of every daily retrieval quiz this lesson has appeared in. Drives promotion
   * from Proficient to Mastered (three passed sessions on three different calendar days).
   */
  retrievalHistory?: RetrievalSession[]
  /**
   * Number of distinct calendar days on which this lesson passed its retrieval slice. Derived from
   * `retrievalHistory`; stored for convenience. Three promotes a Proficient lesson to Mastered.
   */
  successfulRetrievalSessions?: number
  /**
   * Denormalized snapshot of the effective mastery tier at the last write, for persistence/queries.
   * NOT the read authority: `getMasteryStatus` derives the tier live from the best skill check plus
   * the successful-retrieval-day count so the result is independent of completion order. Absent
   * until a skill check is recorded.
   */
  masteryLevel?: MasteryStatus
  /** Calendar day ('YYYY-MM-DD') this lesson last appeared in a retrieval quiz. Absent until then. */
  lastRetrievalDate?: string
}

export type LessonProgressInput = Omit<LessonProgress, 'userId' | 'lessonId'>

export type LessonStatus = 'coming_soon' | 'not_started' | 'in_progress' | 'complete'

export function getProgressDocId(userId: string, lessonId: string): string {
  return `${userId}_${lessonId}`
}

export function createDefaultProgress(userId: string, lessonId: string): LessonProgress {
  return {
    userId,
    lessonId,
    completed: false,
    currentQuestionIndex: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    questionHistory: [],
    skillCheckCompleted: false,
    skillCheckHistory: [],
    awaitingContinue: false,
    skillCheckAttempts: 0,
    requiredRetakeCompleted: false,
    remediationCompleted: false,
    retrievalHistory: [],
    successfulRetrievalSessions: 0,
    // masteryLevel and lastRetrievalDate stay absent until earned (like masteryStatus/skillCheckScore).
  }
}

export function deriveLessonStatus(
  available: boolean,
  progress: LessonProgress | null,
): LessonStatus {
  if (!available) {
    return 'coming_soon'
  }

  if (progress?.completed) {
    return 'complete'
  }

  if (
    progress &&
    (progress.awaitingContinue ||
      progress.currentQuestionIndex > 0 ||
      progress.questionsAnswered > 0)
  ) {
    return 'in_progress'
  }

  return 'not_started'
}
