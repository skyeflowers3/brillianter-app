import { useEffect, useState } from 'react'
import { fetchLessons } from '../services/lessonService'
import type { LessonMetadata } from '../types/lessonMetadata'

export function useLessons() {
  const [lessons, setLessons] = useState<LessonMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const nextLessons = await fetchLessons()
        if (!cancelled) {
          setLessons(nextLessons)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Failed to load lessons.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return { lessons, loading, error }
}
