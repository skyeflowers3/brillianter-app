import { getPreviousLessonId } from '../types/lessonMetadata'
import type { LessonProgress } from '../types/progress'

/**
 * Lessons unlock sequentially: the first lesson is always open, and every later lesson stays locked
 * until the lesson directly before it (by order) has been completed.
 */
export function isLessonUnlocked(
  lessonId: string,
  progressByLesson: Record<string, LessonProgress>,
): boolean {
  const previousLessonId = getPreviousLessonId(lessonId)

  if (!previousLessonId) {
    return true
  }

  return progressByLesson[previousLessonId]?.completed === true
}

/**
 * Whether the learner has begun any lesson. False for a brand-new account (no progress, or only
 * untouched default progress docs), which the dashboard uses to show a "get started" message.
 */
export function hasStartedLearning(progressByLesson: Record<string, LessonProgress>): boolean {
  return Object.values(progressByLesson).some(
    (progress) =>
      progress.completed ||
      progress.questionsAnswered > 0 ||
      progress.currentQuestionIndex > 0 ||
      progress.awaitingContinue,
  )
}
