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
