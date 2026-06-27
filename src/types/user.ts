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
}

export type UserProfileInput = Pick<UserProfile, 'name' | 'email'>
