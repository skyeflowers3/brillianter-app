import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SkillCheckEngine } from '../components/skillcheck/SkillCheckEngine'
import { useAuth } from '../hooks/useAuth'
import { useProgressContext } from '../hooks/useProgressContext'
import { loadSkillCheckContent } from '../services/questionService'
import { recordSkillCheckResult } from '../services/progressService'
import { updateStreak } from '../services/streakService'
import type { LessonContent } from '../types/lesson'
import type { SkillCheckResult } from '../types/progress'
import '../components/skillcheck/skillcheck.css'

export function SkillCheckPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const { user, refreshProfile } = useAuth()
  const { refreshProgress } = useProgressContext()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<LessonContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attemptKey, setAttemptKey] = useState(0)

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

      try {
        await recordSkillCheckResult(user.uid, lessonId, result)
        await updateStreak(user.uid)
        await Promise.all([refreshProgress(), refreshProfile()])
      } catch (persistError) {
        console.warn('Failed to persist skill check result', persistError)
      }
    },
    [lessonId, refreshProfile, refreshProgress, user],
  )

  if (!lessonId) {
    return (
      <section className="lesson-error">
        <h1>Skill check not found</h1>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    )
  }

  if (loading) {
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
      questions={lesson.questions}
      lessonTitle={lesson.title}
      onComplete={(result) => void handleComplete(result)}
      onContinue={() => navigate('/dashboard')}
      onRetry={() => setAttemptKey((current) => current + 1)}
    />
  )
}
