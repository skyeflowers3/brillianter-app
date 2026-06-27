import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fireCelebration } from '../../lib/celebrate'
import { useProgressContext } from '../../hooks/useProgressContext'
import { getMasteryStatus, isRequiredRetakePending } from '../../services/masteryService'
import { getNextLessonId, isLessonAvailable } from '../../types/lessonMetadata'

interface LessonCompleteProps {
  lessonId: string
  lessonTitle: string
  totalQuestions: number
  onRetry: () => void
}

interface PrimaryAction {
  to: string
  label: string
}

export function LessonComplete({
  lessonId,
  lessonTitle,
  totalQuestions,
  onRetry,
}: LessonCompleteProps) {
  const { getProgress } = useProgressContext()
  const progress = getProgress(lessonId)
  const skillCheckDone = Boolean(progress?.skillCheckCompleted)
  const masteryStatus = getMasteryStatus(progress)

  // The end-of-lesson CTA mirrors the dashboard: it depends on whether the skill check has been
  // taken and on the resulting mastery, rather than always pointing at the skill check.
  const primary = resolvePrimaryAction({
    lessonId,
    skillCheckDone,
    masteryStatus,
    retakePending: isRequiredRetakePending(progress),
    nextLessonCompleted: (nextId) => Boolean(getProgress(nextId)?.completed),
  })

  const mastered = skillCheckDone && masteryStatus === 'mastered'

  useEffect(() => {
    // Finishing the questions is a milestone, not mastery — keep this gentle so a perfect
    // skill check stays the real celebration.
    fireCelebration('gentle')
  }, [])

  return (
    <section className="lesson-complete">
      <div className="lesson-complete__card">
        <div className="celebrate-badge celebrate-badge--lesson" aria-hidden="true">
          🎓
        </div>
        <h2 className="lesson-complete__title">Good job! You completed the lesson.</h2>
        <p className="lesson-complete__subtitle">
          You finished all {totalQuestions} questions in “{lessonTitle}”.
        </p>
        <p className="lesson-complete__note muted">
          {mastered
            ? "You've already mastered this lesson — nice work!"
            : 'Your progress has been saved. Ready to test what you learned?'}
        </p>
        <div className="lesson-actions">
          <button type="button" className="button button--secondary" onClick={onRetry}>
            Retry
          </button>
          {mastered && (
            <Link to={`/skill-check/${lessonId}`} className="button button--secondary">
              Retake skill check
            </Link>
          )}
          <Link to={primary.to} className="button button--primary">
            {primary.label}
          </Link>
        </div>
      </div>
    </section>
  )
}

function resolvePrimaryAction({
  lessonId,
  skillCheckDone,
  masteryStatus,
  retakePending,
  nextLessonCompleted,
}: {
  lessonId: string
  skillCheckDone: boolean
  masteryStatus: ReturnType<typeof getMasteryStatus>
  retakePending: boolean
  nextLessonCompleted: (nextLessonId: string) => boolean
}): PrimaryAction {
  // Skill check not taken yet — still send them to take it.
  if (!skillCheckDone || !masteryStatus) {
    return { to: `/skill-check/${lessonId}`, label: 'Continue to skill check' }
  }

  // Already mastered — move toward the next lesson instead of the skill check.
  if (masteryStatus === 'mastered') {
    const nextLessonId = getNextLessonId(lessonId)
    if (nextLessonId && isLessonAvailable(nextLessonId)) {
      return {
        to: `/lesson/${nextLessonId}`,
        label: nextLessonCompleted(nextLessonId) ? 'Review next lesson' : 'Continue to next lesson',
      }
    }
    // Last available lesson and mastered — nothing further to do here.
    return { to: '/dashboard', label: 'Back to dashboard' }
  }

  // Took the skill check but didn't master it. Same criteria as the dashboard: a still-owed
  // required retake nudges a Retake; otherwise it's an Improve Mastery session. Both run the
  // randomized skill check.
  if (masteryStatus === 'needs_review' && retakePending) {
    return { to: `/skill-check/${lessonId}`, label: 'Retake Skill Check' }
  }
  return { to: `/skill-check/${lessonId}`, label: 'Improve Mastery' }
}
