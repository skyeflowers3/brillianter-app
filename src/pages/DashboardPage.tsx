import { useAuth } from '../hooks/useAuth'
import { useLessons } from '../hooks/useLessons'
import { useProgressContext } from '../hooks/useProgressContext'
import { LessonCard } from '../components/dashboard/LessonCard'
import { StreakBadge } from '../components/dashboard/StreakBadge'

export function DashboardPage() {
  const { profile } = useAuth()
  const { lessons, loading, error } = useLessons()
  const { getProgress, loading: progressLoading } = useProgressContext()

  return (
    <section className="dashboard">
      <div className="dashboard__intro">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Welcome back{profile ? `, ${profile.name}` : ''}. Pick up where you left off or start
            something new.
          </p>
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
            <LessonCard key={lesson.lessonId} lesson={lesson} progress={getProgress(lesson.lessonId)} />
          ))}
        </div>
      )}
    </section>
  )
}
