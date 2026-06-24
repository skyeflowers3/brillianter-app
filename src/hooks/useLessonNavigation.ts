import { useContext } from 'react'
import { LessonNavigationContext } from '../context/lesson-navigation-context'

export function useLessonNavigation() {
  const context = useContext(LessonNavigationContext)

  if (!context) {
    throw new Error('useLessonNavigation must be used within a LessonNavigationProvider')
  }

  return context
}
