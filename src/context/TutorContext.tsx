import { useMemo, useState, type ReactNode } from 'react'
import { TutorContext, type TutorContextValue, type TutorQuestionContext } from './tutor-context'

/**
 * Tracks the learner's current question so the always-available AI tutor knows what they're working
 * on. The lesson engine updates it; the tutor widget reads it. Kept separate from lesson navigation
 * so the two concerns stay independent.
 */
export function TutorProvider({ children }: { children: ReactNode }) {
  const [questionContext, setQuestionContext] = useState<TutorQuestionContext | null>(null)

  const value = useMemo<TutorContextValue>(
    () => ({ questionContext, setQuestionContext }),
    [questionContext],
  )

  return <TutorContext.Provider value={value}>{children}</TutorContext.Provider>
}
