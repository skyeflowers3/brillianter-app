/**
 * Client-only "show once" flag for the pre-lesson attempt. It lives in localStorage (keyed per user
 * and lesson) so a pretest appears only on a learner's first entry into a lesson and survives
 * reloads and new tabs. It is deliberately NOT persisted to Firestore: the pretest is never scored
 * and touches no progress or mastery data. If storage is unavailable, the pretest simply shows
 * again, which is harmless.
 */

const PREFIX = 'pretestSeen'

function storageKey(uid: string, lessonId: string): string {
  return `${PREFIX}:${uid}:${lessonId}`
}

export function isPretestSeen(uid: string, lessonId: string): boolean {
  try {
    return window.localStorage.getItem(storageKey(uid, lessonId)) === '1'
  } catch {
    return false
  }
}

export function markPretestSeen(uid: string, lessonId: string): void {
  try {
    window.localStorage.setItem(storageKey(uid, lessonId), '1')
  } catch {
    // Storage disabled (e.g. private mode): the pretest may reappear, which is acceptable.
  }
}

/** Clear every pretest flag for a user, so a progress reset reshows all pretests. */
export function clearPretestSeen(uid: string): void {
  try {
    const storage = window.localStorage
    const prefix = `${PREFIX}:${uid}:`
    const keys: string[] = []
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index)
      if (key && key.startsWith(prefix)) {
        keys.push(key)
      }
    }
    keys.forEach((key) => storage.removeItem(key))
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
