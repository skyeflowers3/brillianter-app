import { describe, it, expect } from 'vitest'
import {
  computeStreakUpdate,
  differenceInCalendarDays,
  isSameDay,
  toDateKey,
} from './dates'

describe('toDateKey', () => {
  it('formats a date as local YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 5, 24))).toBe('2026-06-24')
  })

  it('zero-pads single-digit months and days', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('ignores time-of-day', () => {
    expect(toDateKey(new Date(2026, 2, 9, 23, 59, 59))).toBe('2026-03-09')
  })
})

describe('isSameDay', () => {
  it('returns true for two times on the same calendar day', () => {
    expect(isSameDay(new Date(2026, 5, 24, 1), new Date(2026, 5, 24, 23))).toBe(true)
  })

  it('returns false for different calendar days', () => {
    expect(isSameDay(new Date(2026, 5, 24), new Date(2026, 5, 25))).toBe(false)
  })
})

describe('differenceInCalendarDays', () => {
  it('returns 0 for the same calendar day', () => {
    expect(differenceInCalendarDays(new Date(2026, 5, 24), new Date(2026, 5, 24))).toBe(0)
  })

  it('returns 1 for consecutive calendar days', () => {
    expect(differenceInCalendarDays(new Date(2026, 5, 25), new Date(2026, 5, 24))).toBe(1)
  })

  it('returns the whole-day gap for multi-day differences', () => {
    expect(differenceInCalendarDays(new Date(2026, 5, 30), new Date(2026, 5, 24))).toBe(6)
  })

  it('ignores time-of-day when computing the difference', () => {
    const later = new Date(2026, 5, 25, 0, 1)
    const earlier = new Date(2026, 5, 24, 23, 59)
    expect(differenceInCalendarDays(later, earlier)).toBe(1)
  })

  it('returns a negative value when later is before earlier', () => {
    expect(differenceInCalendarDays(new Date(2026, 5, 24), new Date(2026, 5, 25))).toBe(-1)
  })
})

describe('computeStreakUpdate', () => {
  it('starts a streak on the first activity ever', () => {
    const result = computeStreakUpdate(0, null, new Date(2026, 5, 24))
    expect(result).toEqual({ currentStreak: 1, lastActiveDate: '2026-06-24', changed: true })
  })

  it('does not change the streak for same-day activity', () => {
    const result = computeStreakUpdate(3, '2026-06-24', new Date(2026, 5, 24, 18))
    expect(result).toEqual({ currentStreak: 3, lastActiveDate: '2026-06-24', changed: false })
  })

  it('increments the streak on a consecutive day', () => {
    const result = computeStreakUpdate(1, '2026-06-23', new Date(2026, 5, 24))
    expect(result).toEqual({ currentStreak: 2, lastActiveDate: '2026-06-24', changed: true })
  })

  it('increments a longer streak (5 -> 6) on a consecutive day', () => {
    const result = computeStreakUpdate(5, '2026-06-23', new Date(2026, 5, 24))
    expect(result).toEqual({ currentStreak: 6, lastActiveDate: '2026-06-24', changed: true })
  })

  it('resets the streak to 1 after a gap of 2+ days', () => {
    const result = computeStreakUpdate(5, '2026-06-20', new Date(2026, 5, 24))
    expect(result).toEqual({ currentStreak: 1, lastActiveDate: '2026-06-24', changed: true })
  })

  it('resets the streak to 1 when the previous streak is non-positive', () => {
    const result = computeStreakUpdate(0, '2026-06-23', new Date(2026, 5, 24))
    expect(result).toEqual({ currentStreak: 1, lastActiveDate: '2026-06-24', changed: true })
  })

  it('treats a future lastActiveDate as a same-day no-op', () => {
    const result = computeStreakUpdate(4, '2026-06-25', new Date(2026, 5, 24))
    expect(result).toEqual({ currentStreak: 4, lastActiveDate: '2026-06-25', changed: false })
  })
})
