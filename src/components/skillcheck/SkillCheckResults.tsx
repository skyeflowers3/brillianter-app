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
  onRetry?: () => void
}

export function SkillCheckResults({
  score,
  total,
  questions,
  answers,
  onContinue,
  onRetry,
}: SkillCheckResultsProps) {
  const missed = questions
    .filter(
      (question) =>
        answers.find((answer) => answer.questionId === question.id)?.correct === false,
    )
    .map((question) => ({ question }))

  const isPerfect = missed.length === 0
  // Tier reflects this attempt's score; celebration scales with it (full for perfect, a lighter
  // nod for strong-but-imperfect, and nothing for low scores where confetti would feel wrong).
  const tier = evaluateMastery(score, total)
  const presentation = MASTERY_PRESENTATION[tier]

  useEffect(() => {
    if (tier === 'mastered') {
      fireCelebration('full')
    } else if (tier === 'developing') {
      fireCelebration('light')
    }
  }, [tier])

  return (
    <section className="skillcheck-results">
      <div className="skillcheck-results__card">
        <div className={`celebrate-badge celebrate-badge--${tier}`} aria-hidden="true">
          {presentation.badge}
        </div>
        <p className="skillcheck-results__eyebrow">Skill Check complete</p>
        <p className="skillcheck-results__score">
          You scored {score} / {total}
        </p>
        <p
          className={
            tier === 'needs_review'
              ? 'skillcheck-results__subtitle'
              : 'skillcheck-results__perfect'
          }
        >
          {presentation.message}
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
              Continue
            </button>
          )}
        </div>
      )}
    </section>
  )
}
