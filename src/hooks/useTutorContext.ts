import { useContext } from 'react'
import { TutorContext, type TutorContextValue } from '../context/tutor-context'

// Safe default so components (e.g. the lesson engine) can publish context without crashing when
// rendered outside a TutorProvider — for example in unit tests.
const NOOP_TUTOR_CONTEXT: TutorContextValue = {
  questionContext: null,
  setQuestionContext: () => {},
}

export function useTutorContext(): TutorContextValue {
  return useContext(TutorContext) ?? NOOP_TUTOR_CONTEXT
}
