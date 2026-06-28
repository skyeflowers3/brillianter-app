import { describe, expect, it } from 'vitest'
import { isDailyReviewReminderVisible } from './dailyReviewReminder'
import { FIRST_LESSON_ID } from './retrieval'
import type { LessonProgress } from '../types/progress'
import type { UserProfile } from '../types/user'

const NOW = new Date(2026, 5, 28) // 2026-06-28
const TODAY = '2026-06-28'
const YESTERDAY = '2026-06-27'

function progress(lesson1Completed: boolean): Record<string, LessonProgress> {
  return { [FIRST_LESSON_ID]: { completed: lesson1Completed } as LessonProgress }
}

function profileWith(deferred: string | null | undefined): Pick<UserProfile, 'dailyReviewDeferredDate'> {
  return { dailyReviewDeferredDate: deferred }
}

describe('isDailyReviewReminderVisible', () => {
  it('shows when the learner deferred today and Lesson 1 is complete', () => {
    expect(isDailyReviewReminderVisible(profileWith(TODAY), progress(true), NOW)).toBe(true)
  })

  it('hides when the learner never deferred (the card never appears just because a review is due)', () => {
    expect(isDailyReviewReminderVisible(profileWith(null), progress(true), NOW)).toBe(false)
    expect(isDailyReviewReminderVisible(profileWith(undefined), progress(true), NOW)).toBe(false)
  })

  it('hides once the deferred date is no longer today (yesterday does not carry over)', () => {
    expect(isDailyReviewReminderVisible(profileWith(YESTERDAY), progress(true), NOW)).toBe(false)
  })

  it('hides until the first lesson is completed, even if a date is somehow set', () => {
    expect(isDailyReviewReminderVisible(profileWith(TODAY), progress(false), NOW)).toBe(false)
    expect(isDailyReviewReminderVisible(profileWith(TODAY), {}, NOW)).toBe(false)
  })

  it('hides when there is no profile', () => {
    expect(isDailyReviewReminderVisible(null, progress(true), NOW)).toBe(false)
  })
})
