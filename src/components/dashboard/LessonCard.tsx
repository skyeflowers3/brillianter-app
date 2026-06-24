import { Link } from 'react-router-dom'
import type { LessonMetadata } from '../../types/lessonMetadata'
import { isLessonAvailable } from '../../types/lessonMetadata'
import { deriveLessonStatus, type LessonProgress, type LessonStatus } from '../../types/progress'

interface LessonCardProps {
  lesson: LessonMetadata
  progress: LessonProgress | null
}

const STATUS_LABELS: Record<LessonStatus, string> = {
  coming_soon: 'Coming soon',
  not_started: 'Not started',
  in_progress: 'In progress',
  complete: 'Complete',
}

export function LessonCard({ lesson, progress }: LessonCardProps) {
  const available = isLessonAvailable(lesson.lessonId)
  const status = deriveLessonStatus(available, progress)
  const label = STATUS_LABELS[status]

  const body = (
    <>
      <div className="lesson-card__header">
        <span className="lesson-card__order">Lesson {lesson.lessonOrder}</span>
        <span className={`lesson-card__status lesson-card__status--${status}`}>{label}</span>
      </div>
      <h3 className="lesson-card__title">{lesson.title}</h3>
      <p className="lesson-card__topic">{lesson.topic}</p>
    </>
  )

  if (!available) {
    return (
      <article className="lesson-card lesson-card--disabled" aria-disabled="true">
        {body}
      </article>
    )
  }

  const ctaLabel =
    status === 'complete' ? 'Review lesson' : status === 'in_progress' ? 'Continue' : 'Start'

  const lessonComplete = status === 'complete'
  const skillCheckDone = Boolean(progress?.skillCheckCompleted)
  const latestSkillCheck = progress?.skillCheckHistory?.[progress.skillCheckHistory.length - 1]

  return (
    <article className="lesson-card">
      {body}

      {lessonComplete && (
        <div className="lesson-card__skillcheck">
          {skillCheckDone ? (
            <span className="lesson-card__skillcheck-score">
              Skill check:{' '}
              {latestSkillCheck
                ? `${latestSkillCheck.score} / ${latestSkillCheck.total}`
                : 'Complete'}
            </span>
          ) : (
            <span className="lesson-card__skillcheck-score lesson-card__skillcheck-score--pending">
              Skill check not taken yet
            </span>
          )}
        </div>
      )}

      <div className="lesson-card__actions">
        <Link to={`/lesson/${lesson.lessonId}`} className="button button--primary lesson-card__cta">
          {ctaLabel}
        </Link>
        {lessonComplete && (
          <Link
            to={`/skill-check/${lesson.lessonId}`}
            className="button button--secondary lesson-card__cta"
          >
            {skillCheckDone ? 'Retake skill check' : 'Take skill check'}
          </Link>
        )}
      </div>
    </article>
  )
}
