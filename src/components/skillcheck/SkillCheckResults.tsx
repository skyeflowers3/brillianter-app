import { useEffect } from 'react'
import type { Question } from '../../types/lesson'
import type { SkillCheckAnswer } from '../../types/progress'
import { fireCelebration } from '../../lib/celebrate'
import { evaluateMastery, MASTERY_PRESENTATION } from '../../services/masteryService'
import { ReviewPanel } from './ReviewPanel'
import './skillcheck.css'

interface SkillCheckResultsProps {
  score: number
  total: number
  questions: Question[]
  answers: SkillCheckAnswer[]
  onContinue?: () => void
  /** Label for the Continue button. Defaults to "Continue"; the page sets it to a review-specific
   * label when Continue leads into the personalized review instead of the dashboard. */
  continueLabel?: string
  onRetry?: () => void
}

export function SkillCheckResults({
  score,
  total,
  questions,
  answers,
  onContinue,
  continueLabel = 'Continue',
  onRetry,
}: SkillCheckResultsProps) {
  const missed = questions
    .filter(
      (question) =>
        answers.find((answer) => answer.questionId === question.id)?.correct === false,
    )
    .map((question) => ({ question }))

  const isPerfect = missed.length === 0
  // `scoreTier` is the raw score-based tier (5/5 -> mastered). Celebration scales with it: full for
  // a perfect score, a lighter nod for strong-but-imperfect, nothing for low scores.
  const scoreTier = evaluateMastery(score, total)
  // A skill check on its own tops out at Proficient — Mastered is earned later through spaced
  // retrieval — so what we DISPLAY caps mastered down to proficient. A perfect score still gets the
  // full celebration above; it just isn't labelled Mastered yet.
  const displayTier = scoreTier === 'mastered' ? 'proficient' : scoreTier
  const presentation = MASTERY_PRESENTATION[displayTier]
  const message = isPerfect
    ? 'Perfect score! Keep it sharp with daily reviews to earn long-term Mastered status.'
    : presentation.message

  useEffect(() => {
    if (scoreTier === 'mastered') {
      fireCelebration('full')
    } else if (scoreTier === 'proficient') {
      fireCelebration('light')
    }
  }, [scoreTier])

  return (
    <section className="skillcheck-results">
      <div className="skillcheck-results__card">
        <div className={`celebrate-badge celebrate-badge--${displayTier}`} aria-hidden="true">
          {presentation.badge}
        </div>
        <p className="skillcheck-results__eyebrow">Skill Check complete</p>
        <p className="skillcheck-results__score">
          You scored {score} / {total}
        </p>
        <p className={`skillcheck-results__tier skillcheck-results__tier--${displayTier}`}>
          {presentation.label}
        </p>
        <p
          className={
            displayTier === 'needs_review'
              ? 'skillcheck-results__subtitle'
              : 'skillcheck-results__perfect'
          }
        >
          {message}
        </p>
      </div>

      {!isPerfect && <ReviewPanel missed={missed} />}

      {(onContinue || onRetry) && (
        <div className="skillcheck-results__actions">
          {onRetry && (
            <button type="button" className="button button--secondary" onClick={onRetry}>
              Retry skill check
            </button>
          )}
          {onContinue && (
            <button type="button" className="button button--primary" onClick={onContinue}>
              {continueLabel}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
