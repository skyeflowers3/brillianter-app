import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RetrievalQuizRunner } from '../components/retrieval/RetrievalQuizRunner'
import { RetrievalResults } from '../components/retrieval/RetrievalResults'
import { useAuth } from '../hooks/useAuth'
import { useProgressContext } from '../hooks/useProgressContext'
import {
  buildRetrievalQuiz,
  markRetrievalQuizShown,
  recordRetrievalResults,
  type RetrievalQuiz,
  type RetrievalResultsSummary,
} from '../services/retrievalQuizService'
import { clearDailyReviewDeferred, setDailyReviewDeferred } from '../services/userService'
import { toDateKey } from '../lib/dates'
import type { SkillCheckAnswer } from '../types/progress'

/**
 * The daily spaced-retrieval quiz page (`/daily-review`).
 *
 * Builds one 5-question interleaved quiz from the learner's completed lessons, runs it with no
 * hints, and on completion records each lesson's slice independently and shows a per-lesson
 * summary. Skipping marks today's quiz consumed and returns to the dashboard.
 *
 * Note: this page does not yet gate itself — the dashboard auto-redirect to here lands in a later
 * phase. Reaching it directly when nothing is due simply shows an empty state.
 */
export function DailyReviewPage() {
  const { user, refreshProfile } = useAuth()
  const { progressByLesson, loading: progressLoading, refreshProgress } = useProgressContext()
  const navigate = useNavigate()

  const [quiz, setQuiz] = useState<RetrievalQuiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<RetrievalResultsSummary | null>(null)

  useEffect(() => {
    if (!user || progressLoading) {
      return
    }

    const uid = user.uid
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const built = await buildRetrievalQuiz(uid, progressByLesson)
        if (!cancelled) {
          setQuiz(built)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Failed to build the daily review.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
    // Build once from the loaded progress snapshot. We intentionally don't re-run when
    // progressByLesson changes: recording results refreshes progress, and that must not rebuild
    // (and thus restart) the quiz the learner is on / just finished.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, progressLoading])

  const handleSkip = useCallback(async () => {
    if (user) {
      try {
        // Gate the quiz for today AND record that the learner postponed it, so the dashboard shows
        // the "Daily Review Available" reminder until they complete it.
        await markRetrievalQuizShown(user.uid)
        await setDailyReviewDeferred(user.uid, toDateKey(new Date()))
        await refreshProfile()
      } catch (skipError) {
        console.warn('Failed to mark daily review skipped', skipError)
      }
    }
    navigate('/dashboard')
  }, [navigate, refreshProfile, user])

  const handleComplete = useCallback(
    async (answers: SkillCheckAnswer[]) => {
      if (!user || !quiz) {
        return
      }
      try {
        const result = await recordRetrievalResults(user.uid, quiz.questionLessonMap, answers)
        // Completing today's review clears the postponed flag so the dashboard reminder disappears.
        // Only happens here, after results are recorded — simply opening the review never clears it.
        await clearDailyReviewDeferred(user.uid)
        setSummary(result)
        await Promise.all([refreshProgress(), refreshProfile()])
      } catch (recordError) {
        console.warn('Failed to record daily review results', recordError)
        setError('We couldn’t save your review. Please try again.')
      }
    },
    [quiz, refreshProfile, refreshProgress, user],
  )

  if (summary) {
    return <RetrievalResults summary={summary} onBackToDashboard={() => navigate('/dashboard')} />
  }

  if (loading || progressLoading) {
    return (
      <section className="lesson-error">
        <p className="muted">Loading your daily review...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="lesson-error">
        <h1>Daily review unavailable</h1>
        <p className="muted">{error}</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    )
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <section className="lesson-error">
        <h1>No review available yet</h1>
        <p className="muted">
          Complete your first lesson to start earning daily reviews. Check back tomorrow!
        </p>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    )
  }

  return (
    <RetrievalQuizRunner
      questions={quiz.questions}
      onComplete={(answers) => void handleComplete(answers)}
      onSkip={() => void handleSkip()}
    />
  )
}
