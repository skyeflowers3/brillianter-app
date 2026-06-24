import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import localLessons from '../content/lessons.json'
import type { LessonMetadata } from '../types/lessonMetadata'

function getLocalLessons(): LessonMetadata[] {
  return [...(localLessons as LessonMetadata[])].sort((a, b) => a.lessonOrder - b.lessonOrder)
}

export async function fetchLessons(): Promise<LessonMetadata[]> {
  try {
    const lessonsQuery = query(collection(db, 'lessons'), orderBy('lessonOrder', 'asc'))
    const snapshot = await getDocs(lessonsQuery)

    if (!snapshot.empty) {
      return snapshot.docs.map((entry) => entry.data() as LessonMetadata)
    }
  } catch (error) {
    console.warn('Falling back to local lesson metadata.', error)
  }

  return getLocalLessons()
}

export function getLocalLessonsSync(): LessonMetadata[] {
  return getLocalLessons()
}
