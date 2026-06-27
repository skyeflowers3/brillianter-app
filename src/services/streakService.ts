import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebaseDb'
import { computeStreakUpdate, type StreakUpdate } from '../lib/dates'
import { getUserProfile } from './userService'

export async function updateStreak(uid: string, now: Date = new Date()): Promise<StreakUpdate> {
  const profile = await getUserProfile(uid)

  const update = computeStreakUpdate(
    profile?.currentStreak ?? 0,
    profile?.lastActiveDate ?? null,
    now,
  )

  if (update.changed) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        currentStreak: update.currentStreak,
        lastActiveDate: update.lastActiveDate,
      })
    } catch (error) {
      // The user doc may not exist yet (e.g. profile not created); don't block callers.
      console.warn(`updateStreak: failed to persist streak for ${uid}`, error)
    }
  }

  return update
}
