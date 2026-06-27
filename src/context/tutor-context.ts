import { createContext } from 'react'

/** What the learner is currently looking at, so the AI tutor can be context-aware. */
export interface TutorQuestionContext {
  lessonId?: string
  questionId?: string
  questionPrompt?: string
  /** How many times the learner has missed the CURRENT question so far (0 if not yet missed). */
  currentAttempts?: number
  /** The canonical steps to solve the current question type (so the tutor stays on procedure). */
  solutionSteps?: string
  /** What the learner has done so far and the single next action they should take. */
  progressNote?: string
}

export interface TutorContextValue {
  questionContext: TutorQuestionContext | null
  setQuestionContext: (context: TutorQuestionContext | null) => void
}

export const TutorContext = createContext<TutorContextValue | null>(null)
