import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getAllLessonProgress, saveLessonProgress } from '../services/progressService'
import type { LessonProgress } from '../types/progress'
import { ProgressContext, type ProgressContextValue } from './progress-context'

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [progressByLesson, setProgressByLesson] = useState<Record<string, LessonProgress>>({})
  const [loading, setLoading] = useState(true)

  // Background refresh (e.g. after a skill check is recorded). It deliberately does NOT toggle the
  // global `loading` flag: flipping loading true->false here would make any page that gates on it
  // briefly unmount, which silently restarts an in-progress/just-finished skill check. The initial
  // load below owns the loading state.
  const refreshProgress = useCallback(async () => {
    if (!user) {
      setProgressByLesson({})
      return
    }

    const entries = await getAllLessonProgress(user.uid)
    const next: Record<string, LessonProgress> = {}

    for (const entry of entries) {
      next[entry.lessonId] = entry
    }

    setProgressByLesson(next)
  }, [user])

  useEffect(() => {
    let cancelled = false

    async function loadProgress() {
      if (!user) {
        if (!cancelled) {
          setProgressByLesson({})
          setLoading(false)
        }
        return
      }

      if (!cancelled) {
        setLoading(true)
      }

      try {
        const entries = await getAllLessonProgress(user.uid)
        if (cancelled) {
          return
        }

        const next: Record<string, LessonProgress> = {}
        for (const entry of entries) {
          next[entry.lessonId] = entry
        }
        setProgressByLesson(next)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadProgress()

    return () => {
      cancelled = true
    }
  }, [user])

  const getProgress = useCallback(
    (lessonId: string) => progressByLesson[lessonId] ?? null,
    [progressByLesson],
  )

  const upsertProgress = useCallback(async (progress: LessonProgress) => {
    await saveLessonProgress(progress)
    setProgressByLesson((current) => ({
      ...current,
      [progress.lessonId]: progress,
    }))
  }, [])

  const value = useMemo<ProgressContextValue>(
    () => ({
      progressByLesson,
      loading,
      getProgress,
      upsertProgress,
      refreshProgress,
    }),
    [progressByLesson, loading, getProgress, upsertProgress, refreshProgress],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}
