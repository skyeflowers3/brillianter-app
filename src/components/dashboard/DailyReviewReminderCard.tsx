import { Link } from 'react-router-dom'

/**
 * Dashboard reminder for a daily review the learner postponed via "Skip for Now". It is rendered by
 * the dashboard only when {@link isDailyReviewReminderVisible} is true, and resuming the review
 * reuses the existing `/daily-review` flow. The card stays until that day's review is completed.
 */
export function DailyReviewReminderCard() {
  return (
    <article className="review-reminder-card">
      <div className="review-reminder-card__body">
        <h2 className="review-reminder-card__title">Daily Review Available</h2>
        <p className="review-reminder-card__text">
          You postponed today's review. Complete 5 quick questions to strengthen long-term retention.
        </p>
      </div>
      <Link to="/daily-review" className="button button--primary review-reminder-card__action">
        Start Review
      </Link>
    </article>
  )
}
