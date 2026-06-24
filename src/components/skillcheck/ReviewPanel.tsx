import type { Question } from '../../types/lesson'

/**
 * API choice: the panel receives the already-filtered list of missed questions wrapped as
 * `{ question }` entries, keeping the filtering logic in SkillCheckResults and this component
 * purely presentational.
 */
interface ReviewPanelProps {
  missed: Array<{ question: Question }>
}

export function ReviewPanel({ missed }: ReviewPanelProps) {
  if (missed.length === 0) {
    return null
  }

  return (
    <div className="skillcheck-review">
      <h2 className="skillcheck-review__heading">Review what to revisit</h2>
      <ul className="skillcheck-review__list">
        {missed.map(({ question }) => (
          <li key={question.id} className="skillcheck-review__item">
            <p className="skillcheck-review__prompt">{question.prompt}</p>
            <p className="skillcheck-review__explanation">{question.explanation}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
