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

/** Lesson mastery tier derived from the learner's best skill-check score. */
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
   * True once the learner has completed the required retake after a Needs Review score. Used to
   * unlock the next lesson regardless of the retake score (so they can never get permanently stuck).
   */
  requiredRetakeCompleted: boolean
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
