import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { LessonEngine } from '../components/lesson/LessonEngine'
import { useAuth } from '../hooks/useAuth'
import { useProgressContext } from '../hooks/useProgressContext'
import { buildAnsweredSnapshots, buildLessonResumeState } from '../lib/lessonResume'
import { loadLessonContent } from '../services/questionService'
import {
  ensureLessonProgress,
  resetLessonProgress,
} from '../services/progressService'
import { updateCurrentLessonId } from '../services/userService'
import { applyConceptOutcomes, getMasteryProfile } from '../services/masteryProfileService'
import { getConceptTags } from '../content/conceptTags'
import type { LessonContent } from '../types/lesson'
import type { MasteryProfile } from '../types/masteryProfile'
import type { LessonEnginePersistHandlers } from '../types/lessonEngine'
import type { LessonProgress, QuestionHistoryEntry } from '../types/progress'
import { isLessonAvailable } from '../types/lessonMetadata'
import { isLessonUnlocked } from '../lib/lessonAccess'
import '../styles/lesson.css'

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const { user } = useAuth()
  const {
    getProgress,
    upsertProgress,
    progressByLesson,
    loading: progressLoading,
  } = useProgressContext()
  const [lesson, setLesson] = useState<LessonContent | null>(null)
  const [progress, setProgress] = useState<LessonProgress | null>(null)
  // Snapshot taken at lesson load; drives adaptive strategy nudges. Best-effort — failure just means
  // no nudge, never a blocked lesson.
  const [masteryProfile, setMasteryProfile] = useState<MasteryProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // null = still determining (progress loading); true/false = access decided. Kept as a primitive
  // so it stays referentially stable across progress updates and never re-triggers the load effect.
  const unlocked =
    lessonId && !progressLoading ? isLessonUnlocked(lessonId, progressByLesson) : null

  useEffect(() => {
    if (!lessonId || !user) {
      return
    }

    // Don't load (or create progress for) a lesson the learner hasn't unlocked yet.
    if (unlocked !== true) {
      return
    }

    const activeLessonId = lessonId
    const activeUser = user

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        if (!isLessonAvailable(activeLessonId)) {
          throw new Error('This lesson is not available yet.')
        }

        const [lessonContent, lessonProgress] = await Promise.all([
          loadLessonContent(activeLessonId),
          ensureLessonProgress(activeUser.uid, activeLessonId),
        ])

        if (!lessonContent) {
          throw new Error('Lesson content could not be loaded.')
        }

        await updateCurrentLessonId(activeUser.uid, activeLessonId)

        if (!cancelled) {
          setLesson(lessonContent)
          setProgress({
            ...lessonProgress,
            awaitingContinue: lessonProgress.awaitingContinue ?? false,
          })
        }

        getMasteryProfile(activeUser.uid)
          .then((profile) => {
            if (!cancelled) {
              setMasteryProfile(profile)
            }
          })
          .catch(() => {})
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load lesson.')
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
  }, [lessonId, user, unlocked])

  const persistHandlers = useMemo<LessonEnginePersistHandlers | undefined>(() => {
    if (!user || !lessonId || !progress) {
      return undefined
    }

    return {
      onAnswerRecorded: async ({ questionId, correct, attempts, submittedState }) => {
        // Fold this graded answer into the concept-level mastery profile. Best-effort and
        // non-blocking: enrichment for the AI features, never gating the lesson flow.
        const outcomes = getConceptTags(questionId).map((concept) => ({ concept, correct }))
        if (outcomes.length > 0) {
          void applyConceptOutcomes(user.uid, outcomes).catch((profileError) => {
            console.warn('Mastery profile update failed.', profileError)
          })
        }

        setProgress((current) => {
          if (!current) {
            return current
          }

          const historyEntry: QuestionHistoryEntry = {
            questionId,
            correct,
            attempts,
            submittedState,
          }

          if (submittedState.type === 'drawVector') {
            historyEntry.submittedTip = submittedState.tip
          }

          const updated: LessonProgress = {
            ...current,
            questionsAnswered: current.questionsAnswered + 1,
            correctAnswers: current.correctAnswers + (correct ? 1 : 0),
            incorrectAnswers: current.incorrectAnswers + (correct ? 0 : 1),
            questionHistory: [...current.questionHistory, historyEntry],
            awaitingContinue: true,
          }

          void upsertProgress(updated)
          return updated
        })
      },
      onContinue: async ({ nextQuestionIndex, completed }) => {
        setProgress((current) => {
          if (!current) {
            return current
          }

          const updated: LessonProgress = {
            ...current,
            currentQuestionIndex: nextQuestionIndex,
            awaitingContinue: false,
            completed,
          }

          void upsertProgress(updated)
          return updated
        })
      },
      onLessonReset: async () => {
        const reset = await resetLessonProgress(user.uid, lessonId)
        await upsertProgress(reset)
        setProgress(reset)
      },
    }
  }, [lessonId, progress, upsertProgress, user])

  if (!lessonId) {
    return (
      <section className="lesson-error">
        <h1>Lesson not found</h1>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    )
  }

  if (unlocked === false) {
    return (
      <section className="lesson-error">
        <h1>Lesson locked</h1>
        <p className="muted">
          Finish the previous lesson and score at least 4/5 on its skill check to unlock this one.
        </p>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="lesson-error">
        <p className="muted">Loading lesson...</p>
      </section>
    )
  }

  if (error || !lesson || !progress) {
    return (
      <section className="lesson-error">
        <h1>Lesson not available</h1>
        <p className="muted">{error ?? 'Unable to load this lesson.'}</p>
        <Link to="/dashboard">Back to dashboard</Link>
      </section>
    )
  }

  const cachedProgress = getProgress(lessonId) ?? progress
  const resumeState = buildLessonResumeState(lesson, cachedProgress)
  const answeredSnapshots = buildAnsweredSnapshots(lesson, cachedProgress)

  return (
    <LessonEngine
      lesson={lesson}
      initialQuestionIndex={cachedProgress.currentQuestionIndex}
      initialCompleted={cachedProgress.completed}
      initialResumeState={resumeState}
      initialAnswers={answeredSnapshots}
      persistHandlers={persistHandlers}
      masteryProfile={masteryProfile}
    />
  )
}
