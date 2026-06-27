import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLessons } from '../hooks/useLessons'
import { useProgressContext } from '../hooks/useProgressContext'
import { LessonCard } from '../components/dashboard/LessonCard'
import { ProgressTrackerCard } from '../components/dashboard/ProgressTrackerCard'
import { StreakBadge } from '../components/dashboard/StreakBadge'
import { hasStartedLearning, isLessonUnlocked } from '../lib/lessonAccess'
import { isRetrievalQuizDue } from '../lib/retrieval'

export function DashboardPage() {
  const { profile } = useAuth()
  const { lessons, loading, error } = useLessons()
  const { progressByLesson, getProgress, loading: progressLoading } = useProgressContext()

  // Daily retrieval gate: landing on the dashboard sends the learner into today's review when one is
  // due (Lesson 1 done + not yet shown/consumed today). We wait for the profile and progress to load
  // so `lastRetrievalQuizDate` is known — otherwise a not-yet-loaded profile could redirect after the
  // quiz was already consumed. The redirect is one-way (Daily Review never bounces back here) and
  // becomes a no-op once the day is marked consumed, so there's no loop. This gate lives only on the
  // dashboard; no other page redirects.
  const dailyReviewDue =
    !!profile && !progressLoading && isRetrievalQuizDue(profile, progressByLesson)

  const namePart = profile ? `, ${profile.name}` : ''
  const isNewUser = !hasStartedLearning(progressByLesson)
  const greeting = progressLoading
    ? `Welcome${namePart}.`
    : isNewUser
      ? `Welcome${namePart}! Get started with Lesson 1.`
      : `Welcome back${namePart}.`

  const completedLessons = lessons.filter((lesson) => getProgress(lesson.lessonId)?.completed).length

  if (dailyReviewDue) {
    return <Navigate to="/daily-review" replace />
  }

  return (
    <section className="dashboard">
      <div className="dashboard__intro">
        <h1 className="dashboard__greeting">{greeting}</h1>
        <StreakBadge />
      </div>

      {loading || progressLoading ? (
        <p className="muted">Loading lessons...</p>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : (
        <>
          <ProgressTrackerCard completed={completedLessons} total={lessons.length} />
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
        </>
      )}
    </section>
  )
}
