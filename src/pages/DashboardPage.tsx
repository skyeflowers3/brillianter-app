import { useAuth } from '../hooks/useAuth'
import { useLessons } from '../hooks/useLessons'
import { useProgressContext } from '../hooks/useProgressContext'
import { LessonCard } from '../components/dashboard/LessonCard'
import { StreakBadge } from '../components/dashboard/StreakBadge'
import { hasStartedLearning, isLessonUnlocked } from '../lib/lessonAccess'

export function DashboardPage() {
  const { profile } = useAuth()
  const { lessons, loading, error } = useLessons()
  const { progressByLesson, getProgress, loading: progressLoading } = useProgressContext()

  const namePart = profile ? `, ${profile.name}` : ''
  const isNewUser = !hasStartedLearning(progressByLesson)

  return (
    <section className="dashboard">
      <div className="dashboard__intro">
        <div>
          <h1>Dashboard</h1>
          {progressLoading ? (
            <p className="muted">Welcome{namePart}.</p>
          ) : isNewUser ? (
            <p className="muted">
              Welcome{namePart}! You're all set up. Get started with Lesson 1 below — the next
              lesson unlocks once you finish it.
            </p>
          ) : (
            <p className="muted">
              Welcome back{namePart}. Pick up where you left off or start something new.
            </p>
          )}
        </div>
        <StreakBadge />
      </div>

      {loading || progressLoading ? (
        <p className="muted">Loading lessons...</p>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : (
        <div className="dashboard__lesson-grid">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.lessonId}
              lesson={lesson}
              progress={getProgress(lesson.lessonId)}
              locked={!isLessonUnlocked(lesson.lessonId, progressByLesson)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
