import { describe, expect, it } from 'vitest'
import { passesLessonGate } from './lessonAccess'
import { createDefaultProgress, type LessonProgress } from '../types/progress'

function progress(lessonId: string, overrides: Partial<LessonProgress> = {}): LessonProgress {
  return { ...createDefaultProgress('user-1', lessonId), ...overrides }
}

/** Lesson 1 finished and its skill check passed (5/5 → mastered). */
function lesson1Passed(overrides: Partial<LessonProgress> = {}): LessonProgress {
  return progress('lesson-1', {
    completed: true,
    questionsAnswered: 5,
    skillCheckCompleted: true,
    skillCheckAttempts: 1,
    highestSkillCheckScore: 5,
    latestSkillCheckScore: 5,
    masteryStatus: 'mastered',
    skillCheckHistory: [
      { completedAt: new Date().toISOString(), score: 5, total: 5, answers: [] },
    ],
    ...overrides,
  })
}

describe('passesLessonGate', () => {
  it('keeps the first lesson always unlocked', () => {
    expect(passesLessonGate('lesson-1', {})).toBe(true)
  })

  it('locks lesson 2 until lesson 1 skill check is taken', () => {
    // Lesson 1 finished but no skill check yet.
    const byLesson = { 'lesson-1': progress('lesson-1', { completed: true }) }
    expect(passesLessonGate('lesson-2', byLesson)).toBe(false)
  })

  it('unlocks lesson 2 once lesson 1 skill check is passed', () => {
    expect(passesLessonGate('lesson-2', { 'lesson-1': lesson1Passed() })).toBe(true)
  })

  it('does NOT re-lock lesson 2 after lesson 1 is retried (completed reset, mastery preserved)', () => {
    // Simulates clicking "Retry" on lesson 1: question progress is reset (completed=false,
    // questionsAnswered=0) but the skill-check history / mastery is preserved.
    const retried = lesson1Passed({
      completed: false,
      questionsAnswered: 0,
      currentQuestionIndex: 0,
    })
    expect(passesLessonGate('lesson-2', { 'lesson-1': retried })).toBe(true)
  })

  it('keeps an already-engaged lesson unlocked even if the previous lesson regresses', () => {
    const byLesson = {
      // Previous lesson has no passing skill check...
      'lesson-1': progress('lesson-1', { completed: false }),
      // ...but lesson 2 was already started, so it must stay unlocked.
      'lesson-2': progress('lesson-2', { questionsAnswered: 2 }),
    }
    expect(passesLessonGate('lesson-2', byLesson)).toBe(true)
  })

  it('locks lesson 2 after a Needs Review score until the required retake is completed', () => {
    const needsReview = progress('lesson-1', {
      completed: true,
      skillCheckCompleted: true,
      skillCheckAttempts: 1,
      highestSkillCheckScore: 2,
      masteryStatus: 'needs_review',
      skillCheckHistory: [
        { completedAt: new Date().toISOString(), score: 2, total: 5, answers: [] },
      ],
    })
    expect(passesLessonGate('lesson-2', { 'lesson-1': needsReview })).toBe(false)

    // Completing the personalized review alone is NOT enough — the learner must still retake the
    // skill check afterward.
    const reviewedOnly = { ...needsReview, remediationCompleted: true }
    expect(passesLessonGate('lesson-2', { 'lesson-1': reviewedOnly })).toBe(false)

    // Once the post-review retake is recorded (requiredRetakeCompleted), the next lesson unlocks.
    const retakeDone = {
      ...needsReview,
      remediationCompleted: true,
      requiredRetakeCompleted: true,
    }
    expect(passesLessonGate('lesson-2', { 'lesson-1': retakeDone })).toBe(true)
  })
})
