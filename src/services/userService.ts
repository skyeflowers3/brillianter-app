import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { UserProfile, UserProfileInput } from '../types/user'

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', userId))

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as UserProfile
}

export async function createUserDocument(
  userId: string,
  input: UserProfileInput,
): Promise<UserProfile> {
  const profile: UserProfile = {
    userId,
    name: input.name,
    email: input.email,
    currentStreak: 0,
    lastActiveDate: null,
    currentLessonId: 'lesson-1',
  }

  await setDoc(doc(db, 'users', userId), profile)

  return profile
}

/** Returns the existing profile, or creates one on first sign-in. */
export async function ensureUserDocument(
  userId: string,
  input: UserProfileInput,
): Promise<UserProfile> {
  const existing = await getUserProfile(userId)

  if (existing) {
    return existing
  }

  return createUserDocument(userId, input)
}

export async function updateCurrentLessonId(userId: string, lessonId: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), { currentLessonId: lessonId })
}

/** Resets the profile's progress-related fields back to a brand-new-account state. */
export async function resetUserProgressState(userId: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    currentStreak: 0,
    lastActiveDate: null,
    currentLessonId: 'lesson-1',
  })
}
