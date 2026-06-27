import { getPreviousLessonId } from '../types/lessonMetadata'
import type { LessonProgress } from '../types/progress'
import { getMasteryStatus, isRequiredRetakePending } from '../services/masteryService'

/**
 * Master switch for sequential lesson gating.
 *
 * When `false` (open-access mode) every lesson is unlocked from the start — useful while the app is
 * being demoed/graded so testers can jump to any lesson. Mastery tracking still runs underneath;
 * only the navigation lock is removed.
 *
 * Set back to `true` to restore the mastery-based gating described on `isLessonUnlocked`.
 */
export const LESSON_GATING_ENABLED = true

/**
 * Lessons unlock sequentially, gated by the previous lesson's skill check. The first lesson is
 * always open; every later lesson stays locked until the lesson directly before it (by order):
 *   1. has all its questions completed, AND
 *   2. has a skill check scored at least 4/5 (Mastered or Proficient), OR a required retake was
 *      completed after a Needs Review score (so a struggling learner can never get stuck).
 *
 * A worse retake never re-locks an already-unlocked lesson because mastery uses the best score.
 * And a lesson the learner has already entered never re-locks — so going back to redo or retry an
 * earlier lesson (which resets that earlier lesson's progress) can't lock a later one again.
 *
 * Gating can be turned off entirely via `LESSON_GATING_ENABLED`, in which case every lesson is open.
 */
export function isLessonUnlocked(
  lessonId: string,
  progressByLesson: Record<string, LessonProgress>,
): boolean {
  // Open-access mode: nothing is gated.
  if (!LESSON_GATING_ENABLED) {
    return true
  }

  return passesLessonGate(lessonId, progressByLesson)
}

/**
 * The sequential-gating decision itself, independent of the `LESSON_GATING_ENABLED` switch. Exported
 * so the gating rules (including "never re-lock after retry") can be unit-tested regardless of
 * whether gating is currently enabled for the deployed app.
 */
export function passesLessonGate(
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

  // Unlocking is driven by the previous lesson's SKILL CHECK / mastery, NOT its live `completed`
  // flag. Retrying an earlier lesson's questions resets that lesson's `completed` flag (but
  // deliberately preserves its skill-check history and mastery), so keying off `completed` here
  // would wrongly re-lock a lesson the learner already unlocked. A passed skill check survives
  // retries, so a lesson that was ever unlocked stays unlocked.
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
