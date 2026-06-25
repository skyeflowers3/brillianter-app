interface ProgressTrackerCardProps {
  completed: number
  total: number
}

export function ProgressTrackerCard({ completed, total }: ProgressTrackerCardProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const allDone = total > 0 && completed >= total

  return (
    <article className="progress-card">
      <div className="progress-card__header">
        <h2 className="progress-card__title">Vector lesson progress</h2>
        <span className="progress-card__count">
          {completed} / {total}
        </span>
      </div>
      <div
        className="progress-card__track"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Vector lesson progress"
      >
        <div className="progress-card__fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="progress-card__caption">
        {allDone ? 'All lessons complete — nice work!' : `${pct}% complete`}
      </p>
    </article>
  )
}
