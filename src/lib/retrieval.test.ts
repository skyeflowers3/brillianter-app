import { describe, expect, it } from 'vitest'
import {
  allocateRetrievalSlots,
  applyRetrievalToProgress,
  isRetrievalQuizDue,
  tallyRetrievalByLesson,
  type RetrievalTally,
} from './retrieval'
import {
  createDefaultProgress,
  type LessonProgress,
  type SkillCheckAnswer,
  type SkillCheckHistoryEntry,
} from '../types/progress'
import { getMasteryStatus } from '../services/masteryService'

function progress(lessonId: string, overrides: Partial<LessonProgress> = {}): LessonProgress {
  return { ...createDefaultProgress('user-1', lessonId), ...overrides }
}

function skillCheck(score: number, total = 5): SkillCheckHistoryEntry {
  return { completedAt: new Date().toISOString(), score, total, answers: [] }
}

const TODAY = new Date(2026, 0, 10)

describe('isRetrievalQuizDue', () => {
  it('is not due before the first lesson is completed', () => {
    const byLesson = { 'lesson-1': progress('lesson-1', { completed: false }) }
    expect(isRetrievalQuizDue({ lastRetrievalQuizDate: null }, byLesson, TODAY)).toBe(false)
  })

  it('is due once the first lesson is completed and none shown today', () => {
    const byLesson = { 'lesson-1': progress('lesson-1', { completed: true }) }
    expect(isRetrievalQuizDue({ lastRetrievalQuizDate: null }, byLesson, TODAY)).toBe(true)
  })

  it('is not due again the same calendar day', () => {
    const byLesson = { 'lesson-1': progress('lesson-1', { completed: true }) }
    expect(isRetrievalQuizDue({ lastRetrievalQuizDate: '2026-01-10' }, byLesson, TODAY)).toBe(false)
  })

  it('is due again on a later day', () => {
    const byLesson = { 'lesson-1': progress('lesson-1', { completed: true }) }
    expect(isRetrievalQuizDue({ lastRetrievalQuizDate: '2026-01-09' }, byLesson, TODAY)).toBe(true)
  })

  it('tolerates a missing profile', () => {
    const byLesson = { 'lesson-1': progress('lesson-1', { completed: true }) }
    expect(isRetrievalQuizDue(null, byLesson, TODAY)).toBe(true)
  })
})

describe('allocateRetrievalSlots', () => {
  it('returns nothing when no lessons are completed', () => {
    expect(allocateRetrievalSlots([], {}, 5)).toEqual({})
  })

  it('gives one slot to each lesson when they exactly fill the quiz', () => {
    const slots = allocateRetrievalSlots(['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4', 'lesson-5'], {})
    expect(slots).toEqual({
      'lesson-1': 1,
      'lesson-2': 1,
      'lesson-3': 1,
      'lesson-4': 1,
      'lesson-5': 1,
    })
  })

  it('includes every completed lesson and sums to the total', () => {
    const slots = allocateRetrievalSlots(['lesson-1', 'lesson-2', 'lesson-3'], {})
    expect(Object.keys(slots).sort()).toEqual(['lesson-1', 'lesson-2', 'lesson-3'])
    const sum = Object.values(slots).reduce((a, b) => a + b, 0)
    expect(sum).toBe(5)
    for (const count of Object.values(slots)) {
      expect(count).toBeGreaterThanOrEqual(1)
    }
  })

  it('biases extra slots toward weaker lessons while keeping a base slot for strong ones', () => {
    const slots = allocateRetrievalSlots(
      ['lesson-1', 'lesson-2', 'lesson-3'],
      { 'lesson-3': 5, 'lesson-2': 2, 'lesson-1': 0 },
      5,
    )
    // Weakest (lesson-3) gets the most, weakest two get the extras, strongest keeps its single slot.
    expect(slots['lesson-3']).toBe(2)
    expect(slots['lesson-2']).toBe(2)
    expect(slots['lesson-1']).toBe(1)
  })

  it('puts every slot on the only completed lesson', () => {
    expect(allocateRetrievalSlots(['lesson-1'], {}, 5)).toEqual({ 'lesson-1': 5 })
  })

  it('prioritizes the weakest lessons when there are more lessons than slots', () => {
    const slots = allocateRetrievalSlots(
      ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4', 'lesson-5', 'lesson-6'],
      { 'lesson-6': 10 },
      5,
    )
    const sum = Object.values(slots).reduce((a, b) => a + b, 0)
    expect(sum).toBe(5)
    expect(Object.keys(slots)).toHaveLength(5)
    expect(slots['lesson-6']).toBe(1) // weakest is included
  })
})

describe('tallyRetrievalByLesson', () => {
  const map: Record<string, string> = {
    q1: 'lesson-1',
    q2: 'lesson-1',
    q3: 'lesson-2',
    q4: 'lesson-2',
    q5: 'lesson-3',
  }

  it('passes a lesson at >=80% of its own questions and fails below that', () => {
    const answers: SkillCheckAnswer[] = [
      { questionId: 'q1', correct: true },
      { questionId: 'q2', correct: true }, // lesson-1: 2/2 -> pass
      { questionId: 'q3', correct: true },
      { questionId: 'q4', correct: false }, // lesson-2: 1/2 -> fail
      { questionId: 'q5', correct: true }, // lesson-3: 1/1 -> pass
    ]
    const tallies = tallyRetrievalByLesson(map, answers)
    const byLesson = Object.fromEntries(tallies.map((t) => [t.lessonId, t]))

    expect(byLesson['lesson-1']).toMatchObject({
      questionsPresented: 2,
      questionsCorrect: 2,
      passedRetrievalSession: true,
    })
    expect(byLesson['lesson-2']).toMatchObject({
      questionsPresented: 2,
      questionsCorrect: 1,
      passedRetrievalSession: false,
    })
    expect(byLesson['lesson-3']).toMatchObject({
      questionsPresented: 1,
      questionsCorrect: 1,
      passedRetrievalSession: true,
    })
  })

  it('treats exactly 80% as a pass', () => {
    const fiveMap: Record<string, string> = { a: 'lesson-1', b: 'lesson-1', c: 'lesson-1', d: 'lesson-1', e: 'lesson-1' }
    const answers: SkillCheckAnswer[] = [
      { questionId: 'a', correct: true },
      { questionId: 'b', correct: true },
      { questionId: 'c', correct: true },
      { questionId: 'd', correct: true },
      { questionId: 'e', correct: false }, // 4/5 = 80%
    ]
    expect(tallyRetrievalByLesson(fiveMap, answers)[0].passedRetrievalSession).toBe(true)
  })

  it('ignores answers whose question is not mapped to a lesson', () => {
    const answers: SkillCheckAnswer[] = [
      { questionId: 'q1', correct: true },
      { questionId: 'unknown', correct: false },
    ]
    const tallies = tallyRetrievalByLesson(map, answers)
    expect(tallies).toHaveLength(1)
    expect(tallies[0]).toMatchObject({ lessonId: 'lesson-1', questionsPresented: 1 })
  })
})

describe('applyRetrievalToProgress', () => {
  const passTally: RetrievalTally = {
    lessonId: 'lesson-1',
    questionsPresented: 2,
    questionsCorrect: 2,
    passedRetrievalSession: true,
  }

  it('appends a dated session and refreshes lastRetrievalDate', () => {
    const updated = applyRetrievalToProgress(progress('lesson-1'), passTally, TODAY)
    expect(updated.retrievalHistory).toHaveLength(1)
    expect(updated.retrievalHistory?.[0]).toMatchObject({ date: '2026-01-10', lessonId: 'lesson-1' })
    expect(updated.lastRetrievalDate).toBe('2026-01-10')
    expect(updated.successfulRetrievalSessions).toBe(1)
  })

  it('does not assign a mastery status when no skill check has been taken', () => {
    const updated = applyRetrievalToProgress(progress('lesson-1'), passTally, TODAY)
    expect(updated.masteryLevel).toBeUndefined()
    expect(getMasteryStatus(updated)).toBeNull()
  })

  it('promotes a proficient lesson to mastered on the third successful day', () => {
    const base = progress('lesson-1', {
      skillCheckHistory: [skillCheck(4)],
      masteryStatus: 'proficient',
      retrievalHistory: [
        { date: '2026-01-08', lessonId: 'lesson-1', questionsPresented: 2, questionsCorrect: 2, passedRetrievalSession: true },
        { date: '2026-01-09', lessonId: 'lesson-1', questionsPresented: 2, questionsCorrect: 2, passedRetrievalSession: true },
      ],
      successfulRetrievalSessions: 2,
    })
    const updated = applyRetrievalToProgress(base, passTally, TODAY)
    expect(updated.successfulRetrievalSessions).toBe(3)
    expect(updated.masteryLevel).toBe('mastered')
    expect(getMasteryStatus(updated)).toBe('mastered')
  })

  it('does not count a failed session toward the successful-day total', () => {
    const failTally: RetrievalTally = {
      lessonId: 'lesson-1',
      questionsPresented: 2,
      questionsCorrect: 1,
      passedRetrievalSession: false,
    }
    const base = progress('lesson-1', {
      skillCheckHistory: [skillCheck(4)],
      masteryStatus: 'proficient',
    })
    const updated = applyRetrievalToProgress(base, failTally, TODAY)
    expect(updated.successfulRetrievalSessions).toBe(0)
    expect(updated.masteryLevel).toBe('proficient')
  })
})
