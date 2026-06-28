import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLessons } from '../hooks/useLessons'
import { useProgressContext } from '../hooks/useProgressContext'
import { DailyReviewReminderCard } from '../components/dashboard/DailyReviewReminderCard'
import { LessonCard } from '../components/dashboard/LessonCard'
import { ProgressTrackerCard } from '../components/dashboard/ProgressTrackerCard'
import { StreakBadge } from '../components/dashboard/StreakBadge'
import { hasStartedLearning, isLessonUnlocked } from '../lib/lessonAccess'
import { isDailyReviewReminderVisible } from '../lib/dailyReviewReminder'
import { isRetrievalQuizDue } from '../lib/retrieval'

export function DashboardPage() {
  const { profile, freshLogin, consumeFreshLogin } = useAuth()
  const { lessons, loading, error } = useLessons()
  const { progressByLesson, getProgress, loading: progressLoading } = useProgressContext()

  // Daily retrieval gate: a FRESH login (sign-in or session restore) that lands on the dashboard with
  // a review due (Lesson 1 done + not yet shown/consumed today) is sent into today's review. We wait
  // for the profile and progress to load so `lastRetrievalQuizDate` is known. Gating on `freshLogin`
  // means later in-session visits to the dashboard — e.g. right after finishing a lesson — never
  // trigger it; the next redirect only happens on the next login. The redirect is one-way (Daily
  // Review never bounces back here) and lives only on the dashboard.
  const ready = !!profile && !progressLoading
  const dailyReviewDue = ready && freshLogin && isRetrievalQuizDue(profile, progressByLesson)

  // The fresh-login signal is spent the first time the dashboard evaluates it with data loaded —
  // whether or not we redirect — so completing a lesson and returning here can't open the review.
  useEffect(() => {
    if (ready && freshLogin) {
      consumeFreshLogin()
    }
  }, [ready, freshLogin, consumeFreshLogin])

  const namePart = profile ? `, ${profile.name}` : ''
  const isNewUser = !hasStartedLearning(progressByLesson)
  const greeting = progressLoading
    ? `Welcome${namePart}.`
    : isNewUser
      ? `Welcome${namePart}! Get started with Lesson 1.`
      : `Welcome back${namePart}.`

  const completedLessons = lessons.filter((lesson) => getProgress(lesson.lessonId)?.completed).length

  // Only shown when the learner explicitly postponed today's review via "Skip for Now" and hasn't
  // completed it yet. Independent of the redirect gate above (which fires on a fresh login).
  const showReviewReminder = ready && isDailyReviewReminderVisible(profile, progressByLesson)

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
          {showReviewReminder && <DailyReviewReminderCard />}
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
