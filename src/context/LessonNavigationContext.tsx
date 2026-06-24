import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LessonNavigationContext,
  type LessonNavigationContextValue,
} from './lesson-navigation-context'

export function LessonNavigationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [isLessonComplete, setIsLessonComplete] = useState(false)
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)

  const isMidLesson = activeLessonId !== null && !isLessonComplete

  const setLessonSession = useCallback(
    (session: { lessonId: string | null; isComplete: boolean }) => {
      setActiveLessonId(session.lessonId)
      setIsLessonComplete(session.isComplete)
    },
    [],
  )

  const requestDashboardNavigation = useCallback(() => {
    if (isMidLesson) {
      setIsLeaveDialogOpen(true)
      return
    }

    navigate('/dashboard')
  }, [isMidLesson, navigate])

  const confirmLeaveLesson = useCallback(() => {
    setIsLeaveDialogOpen(false)
    setActiveLessonId(null)
    setIsLessonComplete(false)
    navigate('/dashboard')
  }, [navigate])

  const cancelLeaveLesson = useCallback(() => {
    setIsLeaveDialogOpen(false)
  }, [])

  const value = useMemo<LessonNavigationContextValue>(
    () => ({
      isMidLesson,
      isLeaveDialogOpen,
      requestDashboardNavigation,
      confirmLeaveLesson,
      cancelLeaveLesson,
      setLessonSession,
    }),
    [
      isMidLesson,
      isLeaveDialogOpen,
      requestDashboardNavigation,
      confirmLeaveLesson,
      cancelLeaveLesson,
      setLessonSession,
    ],
  )

  return (
    <LessonNavigationContext.Provider value={value}>{children}</LessonNavigationContext.Provider>
  )
}
