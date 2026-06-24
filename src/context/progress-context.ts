import { createContext } from 'react'
import type { LessonProgress } from '../types/progress'

export interface ProgressContextValue {
  progressByLesson: Record<string, LessonProgress>
  loading: boolean
  getProgress: (lessonId: string) => LessonProgress | null
  upsertProgress: (progress: LessonProgress) => Promise<void>
  refreshProgress: () => Promise<void>
}

export const ProgressContext = createContext<ProgressContextValue | null>(null)
