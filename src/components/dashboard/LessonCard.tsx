import { Link } from 'react-router-dom'
import type { LessonMetadata } from '../../types/lessonMetadata'
import { isLessonAvailable } from '../../types/lessonMetadata'
import { deriveLessonStatus, type LessonProgress, type LessonStatus } from '../../types/progress'
import {
  countSuccessfulRetrievalDays,
  getBestSkillCheck,
  getMasteryStatus,
  isRequiredRetakePending,
  MASTERY_PRESENTATION,
  RETRIEVALS_FOR_MASTERY,
} from '../../services/masteryService'

interface LessonCardProps {
  lesson: LessonMetadata
  progress: LessonProgress | null
  /** When true the lesson is gated behind completing the previous one. */
  locked?: boolean
}

// Includes a synthetic "locked" key (not a real LessonStatus) for sequential gating.
const STATUS_LABELS: Record<LessonStatus | 'locked', string> = {
  coming_soon: 'Coming soon',
  locked: 'Locked',
  not_started: 'Not started',
  in_progress: 'In progress',
  complete: 'Complete',
}

export function LessonCard({ lesson, progress, locked = false }: LessonCardProps) {
  const available = isLessonAvailable(lesson.lessonId)
  const status = deriveLessonStatus(available, progress)
  const isLocked = available && locked
  const displayStatus = !available ? 'coming_soon' : isLocked ? 'locked' : status
  const label = STATUS_LABELS[displayStatus]

  const body = (
    <>
      <div className="lesson-card__header">
        <span className="lesson-card__order">Lesson {lesson.lessonOrder}</span>
        <span className={`lesson-card__status lesson-card__status--${displayStatus}`}>{label}</span>
      </div>
      <h3 className="lesson-card__title">{lesson.title}</h3>
    </>
  )

  if (!available) {
    return (
      <article className="lesson-card lesson-card--disabled" aria-disabled="true">
        {body}
      </article>
    )
  }

  if (isLocked) {
    return (
      <article className="lesson-card lesson-card--locked" aria-disabled="true">
        {body}
        <div className="lesson-card__actions">
          <button
            type="button"
            className="button button--primary lesson-card__cta"
            disabled
            aria-disabled="true"
          >
            Start
          </button>
        </div>
        <p className="lesson-card__lock-hint">
          Finish the previous lesson and score at least 4/5 on its skill check to unlock this one.
        </p>
      </article>
    )
  }

  const lessonComplete = status === 'complete'
  const skillCheckDone = Boolean(progress?.skillCheckCompleted)
  const masteryStatus = getMasteryStatus(progress)
  const bestSkillCheck = progress ? getBestSkillCheck(progress) : null
  // Distinct successful spaced-retrieval days so far — the progress toward turning Proficient into
  // long-term Mastered.
  const retrievalDays = countSuccessfulRetrievalDays(progress?.retrievalHistory)
  // While a required retake is still owed the next lesson stays locked, so we nudge a Retake. Once
  // it's been taken twice (next lesson unlocked, regardless of score), it becomes Improve Mastery.
  const retakePending = isRequiredRetakePending(progress)

  const lessonHref = `/lesson/${lesson.lessonId}`
  const skillCheckHref = `/skill-check/${lesson.lessonId}`

  // Non-complete lessons keep the original Start/Continue CTA.
  if (!lessonComplete) {
    const ctaLabel = status === 'in_progress' ? 'Continue' : 'Start'
    return (
      <article className="lesson-card">
        {body}
        <div className="lesson-card__actions">
          <Link to={lessonHref} className="button button--primary lesson-card__cta">
            {ctaLabel}
          </Link>
        </div>
      </article>
    )
  }

  const reviewLessonLink = (
    <Link to={lessonHref} className="button button--secondary lesson-card__cta">
      Review lesson
    </Link>
  )

  return (
    <article className="lesson-card">
      {body}

      <div className="lesson-card__skillcheck">
        {skillCheckDone && masteryStatus ? (
          <>
            <span
              className={`lesson-card__mastery lesson-card__mastery--${masteryStatus}`}
            >
              <span aria-hidden="true">{MASTERY_PRESENTATION[masteryStatus].badge}</span>
              {MASTERY_PRESENTATION[masteryStatus].label}
            </span>
            {bestSkillCheck && (
              <span className="lesson-card__skillcheck-score">
                Best: {bestSkillCheck.score} / {bestSkillCheck.total}
              </span>
            )}
            {masteryStatus === 'proficient' && (
              <span className="lesson-card__retrieval">
                Pass {RETRIEVALS_FOR_MASTERY} daily reviews to reach Mastery (
                {Math.min(retrievalDays, RETRIEVALS_FOR_MASTERY)}/{RETRIEVALS_FOR_MASTERY} done)
              </span>
            )}
          </>
        ) : (
          <span className="lesson-card__skillcheck-score lesson-card__skillcheck-score--pending">
            Skill check not taken yet
          </span>
        )}
      </div>

      <div className="lesson-card__actions">
        {!skillCheckDone || !masteryStatus ? (
          <>
            {reviewLessonLink}
            <Link to={skillCheckHref} className="button button--primary lesson-card__cta">
              Take skill check
            </Link>
          </>
        ) : masteryStatus === 'mastered' ? (
          <>
            <Link to={lessonHref} className="button button--secondary lesson-card__cta">
              Review lesson
            </Link>
            <Link to={skillCheckHref} className="button button--primary lesson-card__cta">
              Retake skill check
            </Link>
          </>
        ) : masteryStatus === 'needs_review' && retakePending ? (
          <>
            {reviewLessonLink}
            <Link to={skillCheckHref} className="button button--primary lesson-card__cta">
              Retake Skill Check
            </Link>
          </>
        ) : (
          <>
            {reviewLessonLink}
            <Link to={skillCheckHref} className="button button--primary lesson-card__cta">
              Improve Mastery
            </Link>
          </>
        )}
      </div>
    </article>
  )
}
