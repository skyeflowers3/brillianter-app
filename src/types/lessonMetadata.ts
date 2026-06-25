import lessonsData from '../content/lessons.json'

export interface LessonMetadata {
  lessonId: string
  title: string
  topic: string
  lessonOrder: number
}

const LESSONS = lessonsData as LessonMetadata[]

/** Lesson IDs that have playable question content in this MVP phase. */
export const AVAILABLE_LESSON_IDS = new Set([
  'lesson-1',
  'lesson-2',
  'lesson-3',
  'lesson-4',
  'lesson-5',
])

export function isLessonAvailable(lessonId: string): boolean {
  return AVAILABLE_LESSON_IDS.has(lessonId)
}

export function getLessonMetadata(lessonId: string): LessonMetadata | undefined {
  return LESSONS.find((lesson) => lesson.lessonId === lessonId)
}

export function getNextLessonId(lessonId: string): string | null {
  const sorted = [...LESSONS].sort((a, b) => a.lessonOrder - b.lessonOrder)
  const index = sorted.findIndex((lesson) => lesson.lessonId === lessonId)

  if (index === -1 || index >= sorted.length - 1) {
    return null
  }

  return sorted[index + 1].lessonId
}
