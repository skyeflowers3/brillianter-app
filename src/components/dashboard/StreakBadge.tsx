import { useAuth } from '../../hooks/useAuth'

export function StreakBadge() {
  const { profile } = useAuth()
  const streak = profile?.currentStreak ?? 0

  return (
    <div className="streak-badge" aria-label={`Current streak: ${streak} days`}>
      <span className="streak-badge__label">Streak</span>
      <span className="streak-badge__value">{streak}</span>
      <span className="streak-badge__hint muted">
        {streak > 0
          ? `${streak} day${streak === 1 ? '' : 's'} in a row`
          : 'Complete a skill check to start your streak'}
      </span>
    </div>
  )
}
