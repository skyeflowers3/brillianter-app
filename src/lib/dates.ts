export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b)
}

/** Parse a 'YYYY-MM-DD' key into a local-time Date at midnight. */
function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function differenceInCalendarDays(later: Date, earlier: Date): number {
  const laterMidnight = parseDateKey(toDateKey(later))
  const earlierMidnight = parseDateKey(toDateKey(earlier))
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((laterMidnight.getTime() - earlierMidnight.getTime()) / msPerDay)
}

export interface StreakUpdate {
  currentStreak: number
  lastActiveDate: string
  changed: boolean
}

export function computeStreakUpdate(
  previousStreak: number,
  lastActiveDate: string | null,
  today: Date,
): StreakUpdate {
  const todayKey = toDateKey(today)

  // First activity ever: no prior active date recorded.
  if (!lastActiveDate) {
    return { currentStreak: 1, lastActiveDate: todayKey, changed: true }
  }

  const diff = differenceInCalendarDays(today, parseDateKey(lastActiveDate))

  // Same-day activity: streak already counted today, nothing to change.
  // A negative diff means the stored date is in the FUTURE relative to today
  // (e.g. clock skew or timezone edge); treat it as a same-day no-op to be safe.
  if (diff <= 0) {
    return { currentStreak: previousStreak, lastActiveDate, changed: false }
  }

  // Consecutive calendar day: continue the streak.
  if (diff === 1 && previousStreak > 0) {
    return { currentStreak: previousStreak + 1, lastActiveDate: todayKey, changed: true }
  }

  // Broken streak (gap of 2+ days, or a non-positive previous streak): reset to 1.
  return { currentStreak: 1, lastActiveDate: todayKey, changed: true }
}
