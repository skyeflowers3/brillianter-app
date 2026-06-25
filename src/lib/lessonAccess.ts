import { getPreviousLessonId } from '../types/lessonMetadata'
import type { LessonProgress } from '../types/progress'
import { getMasteryStatus, isRequiredRetakePending } from '../services/masteryService'

/**
 * Lessons unlock sequentially, gated by the previous lesson's skill check. The first lesson is
 * always open; every later lesson stays locked until the lesson directly before it (by order):
 *   1. has all its questions completed, AND
 *   2. has a skill check scored at least 2/3 (Mastered or Developing), OR a required retake was
 *      completed after a Needs Review score (so a struggling learner can never get stuck).
 *
 * A worse retake never re-locks an already-unlocked lesson because mastery uses the best score.
 * And a lesson the learner has already entered never re-locks — so going back to redo or retry an
 * earlier lesson (which resets that earlier lesson's progress) can't lock a later one again.
 */
export function isLessonUnlocked(
  lessonId: string,
  progressByLesson: Record<string, LessonProgress>,
): boolean {
  const previousLessonId = getPreviousLessonId(lessonId)

  if (!previousLessonId) {
    return true
  }

  // Once a lesson has actually been engaged with, it stays unlocked permanently. This guards
  // against re-locking when an earlier lesson's progress is later reset (e.g. via "Retry").
  if (hasEngagement(progressByLesson[lessonId])) {
    return true
  }

  const previous = progressByLesson[previousLessonId]

  if (!previous?.completed) {
    return false
  }

  const masteryStatus = getMasteryStatus(previous)

  // Skill check not taken yet — the next lesson stays locked until it is passed.
  if (!masteryStatus) {
    return false
  }

  // Needs Review locks the next lesson only until one required retake has been completed.
  if (masteryStatus === 'needs_review' && isRequiredRetakePending(previous)) {
    return false
  }

  return true
}

/** True when this lesson's own progress shows the learner has genuinely engaged with it. */
function hasEngagement(progress: LessonProgress | undefined): boolean {
  if (!progress) {
    return false
  }
  return (
    progress.completed ||
    progress.questionsAnswered > 0 ||
    progress.currentQuestionIndex > 0 ||
    progress.skillCheckCompleted ||
    (progress.skillCheckAttempts ?? 0) > 0
  )
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
