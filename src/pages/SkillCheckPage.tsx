import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SkillCheckEngine } from '../components/skillcheck/SkillCheckEngine'
import { useAuth } from '../hooks/useAuth'
import { useProgressContext } from '../hooks/useProgressContext'
import { loadSkillCheckContent } from '../services/questionService'
import { recordSkillCheckResult } from '../services/progressService'
import { updateStreak } from '../services/streakService'
import { applyConceptOutcomes, deriveOutcomesFromAnswers } from '../services/masteryProfileService'
import { evaluateMastery } from '../services/masteryService'
import { randomizeSkillCheck } from '../lib/skillCheckRandomizer'
import type { LessonContent } from '../types/lesson'
import type { SkillCheckResult } from '../types/progress'
import '../components/skillcheck/skillcheck.css'

export function SkillCheckPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const { user, refreshProfile } = useAuth()
  const { getProgress, refreshProgress, loading: progressLoading } = useProgressContext()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<LessonContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attemptKey, setAttemptKey] = useState(0)
  // The result the learner just completed. Routing keys off this (not the best-attempt mastery
  // status) so the decision reflects what they actually just scored — and isn't stale while the
  // post-completion progress refresh is still in flight.
  const [lastResult, setLastResult] = useState<SkillCheckResult | null>(null)
  // Latches true once the content and the first progress load are both done. After that we never
  // re-gate on progress loading, so the refreshProgress() call that runs when a skill check finishes
  // can't unmount/remount the engine (which would silently restart the skill check).
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Intentional one-time latch: once content + the first progress load are done we freeze
    // `initialized` so later background progress refreshes can't unmount/remount the engine (which
    // would silently restart the skill check). This deliberately sets state from an effect.
    if (!initialized && lesson && !progressLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitialized(true)
    }
  }, [initialized, lesson, progressLoading])

  // Retakes (a prior attempt exists, or the in-page "Retry" was used) get randomized numbers; the
  // very first attempt uses the authored questions. The set is frozen per attempt — it only
  // regenerates on the first load or when attemptKey changes — so a progress refresh after finishing
  // never swaps the questions out from under the results screen.
  const questions = useMemo(() => {
    if (!lesson || !initialized) {
      return []
    }
    const priorAttempts = (lessonId ? getProgress(lessonId)?.skillCheckAttempts : 0) ?? 0
    const isRetake = priorAttempts > 0 || attemptKey > 0
    return isRetake ? randomizeSkillCheck(lesson.questions) : lesson.questions
    // getProgress is read intentionally without subscribing, to keep the question set stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, attemptKey, initialized, lessonId])

  useEffect(() => {
    if (!lessonId || !user) {
      return
    }

    const activeLessonId = lessonId
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const content = await loadSkillCheckContent(activeLessonId)

        if (!content || content.questions.length === 0) {
          throw new Error('This skill check is not available yet.')
        }

        if (!cancelled) {
          setLesson(content)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Failed to load skill check.',
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
  }, [lessonId, user])

  const handleComplete = useCallback(
    async (result: SkillCheckResult) => {
      if (!user || !lessonId) {
        return
      }

      setLastResult(result)

      try {
        await recordSkillCheckResult(user.uid, lessonId, result)
        // Fold the skill-check signals into the concept-level mastery profile so feedback, practice,
        // and remediation all see which concepts were missed.
        await applyConceptOutcomes(user.uid, deriveOutcomesFromAnswers(questions, result.answers))
        await updateStreak(user.uid)
        await Promise.all([refreshProgress(), refreshProfile()])
      } catch (persistError) {
        console.warn('Failed to persist skill check result', persistError)
      }
    },
    [lessonId, questions, refreshProfile, refreshProgress, user],
  )

  // Routing is based on the attempt they just completed: a passing score (Proficient/Mastered, i.e.
  // 4/5 or better) goes straight to the dashboard, while a Needs Review attempt (<4/5) routes into
  // the personalized remediation flow so failing again sends the learner to a fresh practice.
  const continuesToReview =
    !!lessonId &&
    !!lastResult &&
    evaluateMastery(lastResult.score, lastResult.total) === 'needs_review'

  const handleContinue = useCallback(() => {
    navigate(continuesToReview ? `/remediation/${lessonId}` : '/dashboard')
  }, [continuesToReview, lessonId, navigate])

  if (!lessonId) {
    return (
      <section className="lesson-error">
        <h1>Skill check not found</h1>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    )
  }

  if (loading || !initialized) {
    return (
      <section className="lesson-error">
        <p className="muted">Loading skill check...</p>
      </section>
    )
  }

  if (error || !lesson) {
    return (
      <section className="lesson-error">
        <h1>Skill check not available</h1>
        <p className="muted">{error ?? 'Unable to load this skill check.'}</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    )
  }

  return (
    <SkillCheckEngine
      key={attemptKey}
      questions={questions}
      lessonTitle={lesson.title}
      onComplete={(result) => void handleComplete(result)}
      onContinue={handleContinue}
      continueLabel={continuesToReview ? 'Continue to personalized review' : 'Continue'}
      onRetry={() => setAttemptKey((current) => current + 1)}
    />
  )
}
