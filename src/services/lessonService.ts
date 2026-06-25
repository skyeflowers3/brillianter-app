import localLessons from '../content/lessons.json'
import type { LessonMetadata } from '../types/lessonMetadata'

function getLocalLessons(): LessonMetadata[] {
  return [...(localLessons as LessonMetadata[])].sort((a, b) => a.lessonOrder - b.lessonOrder)
}

/**
 * Lesson content ships in the app bundle, so this resolves instantly with no network round-trip.
 * Firestore is reserved for per-user data (auth, progress); updating lessons requires a redeploy.
 */
export async function fetchLessons(): Promise<LessonMetadata[]> {
  return getLocalLessons()
}

export function getLocalLessonsSync(): LessonMetadata[] {
  return getLocalLessons()
}
