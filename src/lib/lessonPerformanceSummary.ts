import type { LessonProgress } from '../types/progress'

const MASTERY_PHRASES: Record<NonNullable<LessonProgress['masteryStatus']>, string> = {
  mastered: 'They have already mastered this lesson, so keep it light and confirming.',
  proficient: 'They are proficient in this lesson but still have a little room to grow.',
  needs_review: 'This lesson is marked "needs review" for them, so reinforce the fundamentals.',
}

/**
 * Builds a short, natural-language summary of how the learner is doing in the CURRENT lesson, for
 * the AI tutor's context. Combines the immediate signal (how many times they've missed the question
 * they're on) with the lesson-level trend (correct vs. incorrect so far, and mastery tier).
 *
 * Returns `undefined` when there is nothing meaningful to say yet, so callers can omit it entirely.
 */
export function summarizeLessonPerformance(
  progress: LessonProgress | null,
  currentAttempts: number | undefined,
): string | undefined {
  const parts: string[] = []

  // In-the-moment struggle on the active question carries the strongest signal.
  if (typeof currentAttempts === 'number' && currentAttempts >= 2) {
    parts.push(
      `They have missed the current question ${currentAttempts} times in a row, so they are ` +
        'struggling with it right now — be extra patient and break it into the smallest possible step.',
    )
  } else if (currentAttempts === 1) {
    parts.push('They just missed the current question once.')
  }

  if (progress) {
    const correct = progress.correctAnswers ?? 0
    const incorrect = progress.incorrectAnswers ?? 0
    const answered = correct + incorrect

    // Only describe a trend once there's enough of a sample to be meaningful.
    if (answered >= 3) {
      if (incorrect === 0) {
        parts.push(`So far in this lesson they are doing well (${correct} correct with no misses).`)
      } else if (incorrect > correct) {
        parts.push(
          `So far in this lesson they have struggled (${correct} correct vs ${incorrect} incorrect).`,
        )
      } else {
        parts.push(`So far in this lesson: ${correct} correct, ${incorrect} incorrect.`)
      }
    }

    if (progress.masteryStatus) {
      parts.push(MASTERY_PHRASES[progress.masteryStatus])
    }
  }

  return parts.length > 0 ? parts.join(' ') : undefined
}
