import { describe, expect, it } from 'vitest'
import {
  computeMasteryLevel,
  countSuccessfulRetrievalDays,
  getMasteryStatus,
} from './masteryService'
import {
  createDefaultProgress,
  type LessonProgress,
  type RetrievalSession,
  type SkillCheckHistoryEntry,
} from '../types/progress'

function progress(overrides: Partial<LessonProgress> = {}): LessonProgress {
  return { ...createDefaultProgress('user-1', 'lesson-1'), ...overrides }
}

function skillCheck(score: number, total = 5): SkillCheckHistoryEntry {
  return { completedAt: new Date().toISOString(), score, total, answers: [] }
}

/** N passed retrieval sessions on N distinct calendar days. */
function passedRetrievals(days: number): RetrievalSession[] {
  return Array.from({ length: days }, (_, i) => ({
    date: `2026-01-0${i + 1}`,
    lessonId: 'lesson-1',
    questionsPresented: 2,
    questionsCorrect: 2,
    passedRetrievalSession: true,
  }))
}

describe('countSuccessfulRetrievalDays', () => {
  it('counts distinct passed days only', () => {
    expect(countSuccessfulRetrievalDays(passedRetrievals(3))).toBe(3)
  })

  it('ignores failed sessions', () => {
    const history: RetrievalSession[] = [
      { date: '2026-01-01', lessonId: 'lesson-1', questionsPresented: 2, questionsCorrect: 1, passedRetrievalSession: false },
      { date: '2026-01-02', lessonId: 'lesson-1', questionsPresented: 2, questionsCorrect: 2, passedRetrievalSession: true },
    ]
    expect(countSuccessfulRetrievalDays(history)).toBe(1)
  })

  it('dedupes passes recorded on the same calendar day', () => {
    const history: RetrievalSession[] = [
      { date: '2026-01-01', lessonId: 'lesson-1', questionsPresented: 2, questionsCorrect: 2, passedRetrievalSession: true },
      { date: '2026-01-01', lessonId: 'lesson-1', questionsPresented: 1, questionsCorrect: 1, passedRetrievalSession: true },
    ]
    expect(countSuccessfulRetrievalDays(history)).toBe(1)
  })

  it('handles missing/empty history', () => {
    expect(countSuccessfulRetrievalDays(undefined)).toBe(0)
    expect(countSuccessfulRetrievalDays([])).toBe(0)
  })
})

describe('computeMasteryLevel', () => {
  it('keeps needs_review regardless of retrievals', () => {
    expect(computeMasteryLevel('needs_review', 5)).toBe('needs_review')
  })

  it('promotes to mastered at three successful retrieval days', () => {
    expect(computeMasteryLevel('proficient', 3)).toBe('mastered')
  })

  it('stays proficient below three retrieval days', () => {
    expect(computeMasteryLevel('proficient', 2)).toBe('proficient')
  })
})

describe('getMasteryStatus order independence', () => {
  it('returns null when retrieval checks pass but no skill check has been taken', () => {
    const p = progress({ retrievalHistory: passedRetrievals(3) })
    expect(getMasteryStatus(p)).toBeNull()
  })

  it('becomes mastered when a passing skill check arrives AFTER three retrieval days', () => {
    const p = progress({
      retrievalHistory: passedRetrievals(3),
      skillCheckHistory: [skillCheck(4)],
      masteryStatus: 'proficient',
    })
    expect(getMasteryStatus(p)).toBe('mastered')
  })

  it('becomes mastered when retrieval days reach three AFTER a passing skill check', () => {
    const p = progress({
      skillCheckHistory: [skillCheck(4)],
      masteryStatus: 'proficient',
      retrievalHistory: passedRetrievals(3),
    })
    expect(getMasteryStatus(p)).toBe('mastered')
  })

  it('caps a fresh 5/5 skill check at proficient until spaced retrieval is earned', () => {
    const p = progress({ skillCheckHistory: [skillCheck(5)], masteryStatus: 'proficient' })
    expect(getMasteryStatus(p)).toBe('proficient')
  })

  it('stays proficient with only two successful retrieval days', () => {
    const p = progress({
      skillCheckHistory: [skillCheck(4)],
      masteryStatus: 'proficient',
      retrievalHistory: passedRetrievals(2),
    })
    expect(getMasteryStatus(p)).toBe('proficient')
  })

  it('a failing skill check stays needs_review even with three retrieval days', () => {
    const p = progress({
      skillCheckHistory: [skillCheck(2)],
      masteryStatus: 'needs_review',
      retrievalHistory: passedRetrievals(3),
    })
    expect(getMasteryStatus(p)).toBe('needs_review')
  })

  it('ignores a stale/legacy stored mastered value and derives the tier live', () => {
    // A perfect skill check with no spaced-retrieval days is Proficient, even if an old doc still
    // carries masteryStatus: 'mastered'. Mastered must be re-earned through spaced retrieval.
    const p = progress({ skillCheckHistory: [skillCheck(5)], masteryStatus: 'mastered' })
    expect(getMasteryStatus(p)).toBe('proficient')
  })

  it('derives mastered for a 5/5 only after three successful retrieval days', () => {
    const p = progress({
      skillCheckHistory: [skillCheck(5)],
      masteryStatus: 'mastered',
      retrievalHistory: passedRetrievals(3),
    })
    expect(getMasteryStatus(p)).toBe('mastered')
  })
})
