import type { QuestionInteractionState } from './lesson'

export interface LessonProgressUpdate {
  questionId: string
  correct: boolean
  attempts: number
  submittedState: QuestionInteractionState
}

export interface LessonContinueUpdate {
  nextQuestionIndex: number
  completed: boolean
}

export interface LessonResumeState {
  questionIndex: number
  phase: 'exploring' | 'correct' | 'incorrect'
  attempts: number
  showHint: boolean
  showExplanation: boolean
  interactionState?: QuestionInteractionState
  /** @deprecated Use interactionState */
  tip?: [number, number]
}

/** A previously-answered question reconstructed from saved history, for back-navigation. */
export interface AnsweredQuestionSnapshot {
  questionIndex: number
  phase: 'correct' | 'incorrect'
  attempts: number
  showHint: boolean
  showExplanation: boolean
  interactionState: QuestionInteractionState
}

export interface LessonEnginePersistHandlers {
  onAnswerRecorded: (update: LessonProgressUpdate) => Promise<void>
  onContinue: (update: LessonContinueUpdate) => Promise<void>
  onLessonReset: () => Promise<void>
}
