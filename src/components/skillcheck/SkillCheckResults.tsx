import type { Question } from '../../types/lesson'
import type { SkillCheckAnswer } from '../../types/progress'
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

  return (
    <section className="skillcheck-results">
      <div className="skillcheck-results__card">
        <p className="skillcheck-results__eyebrow">Skill Check complete</p>
        <p className="skillcheck-results__score">
          You scored {score} / {total}
        </p>
        {isPerfect ? (
          <p className="skillcheck-results__perfect">Perfect score! Every answer was correct.</p>
        ) : (
          <p className="skillcheck-results__subtitle">
            Nice work — here are the ones worth another look.
          </p>
        )}
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
