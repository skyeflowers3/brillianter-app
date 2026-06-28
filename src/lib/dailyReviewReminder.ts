import { toDateKey } from './dates'
import { FIRST_LESSON_ID } from './retrieval'
import type { LessonProgress } from '../types/progress'
import type { UserProfile } from '../types/user'

/**
 * Whether the dashboard should show the "Daily Review Available" reminder card.
 *
 * The card represents a review the learner CHOSE to postpone, so it is intentionally NOT shown just
 * because a review is available. It appears only when all of these hold:
 *
 *   1. A daily review is available for the current day (the first lesson is completed).
 *   2. The learner pressed "Skip for Now" on today's review prompt — recorded as
 *      `dailyReviewDeferredDate === today`.
 *   3. They have not yet completed today's review — completing it clears the deferred date.
 *
 * Because the flag is a specific calendar day, yesterday's deferral never carries into a new day:
 * the learner must see tomorrow's prompt and skip again for the card to reappear. Pure and
 * side-effect free (pass `now` to test).
 */
export function isDailyReviewReminderVisible(
  profile: Pick<UserProfile, 'dailyReviewDeferredDate'> | null | undefined,
  progressByLesson: Record<string, LessonProgress>,
  now: Date = new Date(),
): boolean {
  if (!progressByLesson[FIRST_LESSON_ID]?.completed) {
    return false
  }
  return (profile?.dailyReviewDeferredDate ?? null) === toDateKey(now)
}
