import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseDb'
import type { UserProfile, UserProfileInput } from '../types/user'

/**
 * The progress-related fields of a brand-new account. Shared by account creation and "Reset
 * progress" so a reset always lands the learner in the exact same state as a fresh sign-up — in
 * particular `lastRetrievalQuizDate: null`, so a daily review becomes due again as soon as Lesson 1
 * is completed. Identity fields (userId/name/email) are intentionally excluded.
 */
const NEW_ACCOUNT_PROGRESS_STATE = {
  currentStreak: 0,
  lastActiveDate: null,
  currentLessonId: 'lesson-1',
  lastRetrievalQuizDate: null,
  dailyReviewDeferredDate: null,
} satisfies Partial<UserProfile>

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
    ...NEW_ACCOUNT_PROGRESS_STATE,
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

/**
 * Records the calendar day ('YYYY-MM-DD') the daily retrieval quiz was last shown, which gates it to
 * once per day. Set whether the learner takes or skips the quiz. Best-effort: a failure here only
 * risks the quiz reappearing later the same day, so it must not block the caller.
 */
export async function setLastRetrievalQuizDate(userId: string, dateKey: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), { lastRetrievalQuizDate: dateKey })
  } catch (error) {
    console.warn(`setLastRetrievalQuizDate: failed for ${userId}`, error)
  }
}

/**
 * Records the calendar day ('YYYY-MM-DD') the learner deferred today's daily review by pressing
 * "Skip for Now". The dashboard reminder card keys off this. Best-effort: a failure here only means
 * the reminder card won't appear, so it must not block returning to the dashboard.
 */
export async function setDailyReviewDeferred(userId: string, dateKey: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), { dailyReviewDeferredDate: dateKey })
  } catch (error) {
    console.warn(`setDailyReviewDeferred: failed for ${userId}`, error)
  }
}

/**
 * Clears the deferred-review flag once the learner completes that day's review, so the dashboard
 * reminder card disappears. Best-effort: a failure only risks the card lingering until the date no
 * longer matches today, so it must not block the completion flow.
 */
export async function clearDailyReviewDeferred(userId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), { dailyReviewDeferredDate: null })
  } catch (error) {
    console.warn(`clearDailyReviewDeferred: failed for ${userId}`, error)
  }
}

/** Resets the profile's progress-related fields back to a brand-new-account state. */
export async function resetUserProgressState(userId: string): Promise<void> {
  await updateDoc(doc(db, 'users', userId), { ...NEW_ACCOUNT_PROGRESS_STATE })
}
