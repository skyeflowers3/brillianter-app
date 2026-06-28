export interface UserProfile {
  userId: string
  name: string
  email: string
  currentStreak: number
  lastActiveDate: string | null
  currentLessonId: string
  /**
   * Calendar day ('YYYY-MM-DD') the learner was last shown the daily retrieval quiz. Gates the quiz
   * to once per calendar day (set whether they take or skip it). Null until the first quiz is due.
   */
  lastRetrievalQuizDate?: string | null
  /**
   * Calendar day ('YYYY-MM-DD') the learner pressed "Skip for Now" on the daily review prompt. Set
   * ONLY on skip (never just because a review is available) and cleared when that day's review is
   * completed. The dashboard shows a "Daily Review Available" reminder while this equals today, so a
   * postponed review can be resumed. Does not carry over to future days (it's a specific date).
   */
  dailyReviewDeferredDate?: string | null
}

export type UserProfileInput = Pick<UserProfile, 'name' | 'email'>
