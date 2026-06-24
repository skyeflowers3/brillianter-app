export interface UserProfile {
  userId: string
  name: string
  email: string
  currentStreak: number
  lastActiveDate: string | null
  currentLessonId: string
}

export type UserProfileInput = Pick<UserProfile, 'name' | 'email'>
