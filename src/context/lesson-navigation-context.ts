import { createContext } from 'react'

export interface LessonNavigationContextValue {
  isMidLesson: boolean
  isLeaveDialogOpen: boolean
  requestDashboardNavigation: () => void
  confirmLeaveLesson: () => void
  cancelLeaveLesson: () => void
  setLessonSession: (session: { lessonId: string | null; isComplete: boolean }) => void
}

export const LessonNavigationContext = createContext<LessonNavigationContextValue | null>(
  null,
)
