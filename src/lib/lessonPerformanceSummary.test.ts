import { describe, expect, it } from 'vitest'
import { summarizeLessonPerformance } from './lessonPerformanceSummary'
import { createDefaultProgress, type LessonProgress } from '../types/progress'

function progress(overrides: Partial<LessonProgress> = {}): LessonProgress {
  return { ...createDefaultProgress('user-1', 'lesson-1'), ...overrides }
}

describe('summarizeLessonPerformance', () => {
  it('returns undefined when there is nothing meaningful to report', () => {
    expect(summarizeLessonPerformance(null, undefined)).toBeUndefined()
    expect(summarizeLessonPerformance(progress(), 0)).toBeUndefined()
  })

  it('flags an in-the-moment struggle on the current question', () => {
    const summary = summarizeLessonPerformance(null, 2)
    expect(summary).toMatch(/struggling with it right now/i)
    expect(summary).toMatch(/2 times/)
  })

  it('mentions a single recent miss', () => {
    expect(summarizeLessonPerformance(null, 1)).toMatch(/missed the current question once/i)
  })

  it('describes a strong lesson-level trend', () => {
    const summary = summarizeLessonPerformance(
      progress({ correctAnswers: 4, incorrectAnswers: 0 }),
      0,
    )
    expect(summary).toMatch(/doing well/i)
  })

  it('describes a struggling lesson-level trend', () => {
    const summary = summarizeLessonPerformance(
      progress({ correctAnswers: 1, incorrectAnswers: 3 }),
      0,
    )
    expect(summary).toMatch(/struggled/i)
  })

  it('includes mastery tier guidance when present', () => {
    const summary = summarizeLessonPerformance(
      progress({ correctAnswers: 5, incorrectAnswers: 0, masteryStatus: 'mastered' }),
      0,
    )
    expect(summary).toMatch(/mastered this lesson/i)
  })

  it('combines current-question struggle with lesson trend', () => {
    const summary = summarizeLessonPerformance(
      progress({ correctAnswers: 1, incorrectAnswers: 3 }),
      2,
    )
    expect(summary).toMatch(/struggling with it right now/i)
    expect(summary).toMatch(/struggled/i)
  })
})
