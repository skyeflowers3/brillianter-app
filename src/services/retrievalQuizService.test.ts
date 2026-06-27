import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createDefaultProgress,
  type LessonProgress,
  type RetrievalSession,
  type SkillCheckAnswer,
  type SkillCheckHistoryEntry,
} from '../types/progress'

// Isolate the service from I/O by mocking only its side-effecting dependencies. The pure logic it
// orchestrates — masteryService, lib/retrieval, lib/dates, lessonMetadata — is left REAL so these
// tests exercise the actual mastery/allocation/tally math end to end.
const ensureLessonProgress = vi.fn()
const saveLessonProgress = vi.fn()
const setLastRetrievalQuizDate = vi.fn()
const getMasteryProfile = vi.fn()
const getWeakConcepts = vi.fn()
const collectTemplates = vi.fn()
const generatePracticeForLesson = vi.fn()

vi.mock('./progressService', () => ({
  ensureLessonProgress: (...args: unknown[]) => ensureLessonProgress(...args),
  saveLessonProgress: (...args: unknown[]) => saveLessonProgress(...args),
}))
vi.mock('./userService', () => ({
  setLastRetrievalQuizDate: (...args: unknown[]) => setLastRetrievalQuizDate(...args),
}))
vi.mock('./masteryProfileService', () => ({
  getMasteryProfile: (...args: unknown[]) => getMasteryProfile(...args),
  getWeakConcepts: (...args: unknown[]) => getWeakConcepts(...args),
}))
vi.mock('./practiceEngine', () => ({
  collectTemplates: (...args: unknown[]) => collectTemplates(...args),
  generatePracticeForLesson: (...args: unknown[]) => generatePracticeForLesson(...args),
}))

import {
  buildRetrievalQuiz,
  markRetrievalQuizShown,
  recordRetrievalResults,
} from './retrievalQuizService'

const TODAY = new Date(2026, 0, 10)

function progress(lessonId: string, overrides: Partial<LessonProgress> = {}): LessonProgress {
  return { ...createDefaultProgress('user-1', lessonId), ...overrides }
}

function skillCheck(score: number, total = 5): SkillCheckHistoryEntry {
  return { completedAt: new Date().toISOString(), score, total, answers: [] }
}

function passedRetrievals(lessonId: string, dates: string[]): RetrievalSession[] {
  return dates.map((date) => ({
    date,
    lessonId,
    questionsPresented: 2,
    questionsCorrect: 2,
    passedRetrievalSession: true,
  }))
}

describe('recordRetrievalResults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    saveLessonProgress.mockResolvedValue(undefined)
    setLastRetrievalQuizDate.mockResolvedValue(undefined)
  })

  it('records each lesson independently — not by the overall quiz score', async () => {
    // Overall the learner got 4/5 (80%), which would "pass" as a whole — but lesson-2's own slice
    // (1/2) must be recorded as failed, proving credit is per-lesson, not per-quiz.
    const map: Record<string, string> = {
      q1: 'lesson-1',
      q2: 'lesson-1',
      q3: 'lesson-2',
      q4: 'lesson-2',
      q5: 'lesson-3',
    }
    const answers: SkillCheckAnswer[] = [
      { questionId: 'q1', correct: true },
      { questionId: 'q2', correct: true }, // lesson-1: 2/2 -> pass
      { questionId: 'q3', correct: true },
      { questionId: 'q4', correct: false }, // lesson-2: 1/2 -> fail
      { questionId: 'q5', correct: true }, // lesson-3: 1/1 -> pass
    ]
    ensureLessonProgress.mockImplementation(async (_uid: string, lessonId: string) =>
      progress(lessonId, { skillCheckHistory: [skillCheck(4)], masteryStatus: 'proficient' }),
    )

    const summary = await recordRetrievalResults('user-1', map, answers, TODAY)

    // One independent save per lesson that had questions.
    expect(saveLessonProgress).toHaveBeenCalledTimes(3)
    const saved = Object.fromEntries(
      saveLessonProgress.mock.calls.map(([p]: [LessonProgress]) => [p.lessonId, p]),
    ) as Record<string, LessonProgress>

    expect(saved['lesson-1'].retrievalHistory?.at(-1)).toMatchObject({
      date: '2026-01-10',
      questionsPresented: 2,
      questionsCorrect: 2,
      passedRetrievalSession: true,
    })
    expect(saved['lesson-2'].retrievalHistory?.at(-1)).toMatchObject({
      questionsPresented: 2,
      questionsCorrect: 1,
      passedRetrievalSession: false,
    })
    expect(saved['lesson-3'].retrievalHistory?.at(-1)).toMatchObject({
      questionsPresented: 1,
      questionsCorrect: 1,
      passedRetrievalSession: true,
    })

    const byLesson = Object.fromEntries(summary.lessons.map((l) => [l.lessonId, l]))
    expect(byLesson['lesson-1'].passedRetrievalSession).toBe(true)
    expect(byLesson['lesson-2'].passedRetrievalSession).toBe(false)
    expect(byLesson['lesson-3'].passedRetrievalSession).toBe(true)
  })

  it('stamps lastRetrievalQuizDate with the quiz day (completing consumes the day)', async () => {
    ensureLessonProgress.mockImplementation(async (_uid: string, lessonId: string) =>
      progress(lessonId),
    )

    const summary = await recordRetrievalResults(
      'user-1',
      { q1: 'lesson-1' },
      [{ questionId: 'q1', correct: true }],
      TODAY,
    )

    expect(setLastRetrievalQuizDate).toHaveBeenCalledWith('user-1', '2026-01-10')
    expect(summary.date).toBe('2026-01-10')
  })

  it('flags promotion to Mastered on a lesson reaching its third successful retrieval day', async () => {
    ensureLessonProgress.mockImplementation(async (_uid: string, lessonId: string) =>
      lessonId === 'lesson-1'
        ? progress('lesson-1', {
            skillCheckHistory: [skillCheck(4)],
            masteryStatus: 'proficient',
            retrievalHistory: passedRetrievals('lesson-1', ['2026-01-08', '2026-01-09']),
            successfulRetrievalSessions: 2,
          })
        : progress(lessonId, {
            skillCheckHistory: [skillCheck(4)],
            masteryStatus: 'proficient',
          }),
    )
    const map: Record<string, string> = {
      q1: 'lesson-1',
      q2: 'lesson-1',
      q3: 'lesson-2',
      q4: 'lesson-2',
    }
    const answers: SkillCheckAnswer[] = [
      { questionId: 'q1', correct: true },
      { questionId: 'q2', correct: true }, // lesson-1: 2/2 -> third successful day
      { questionId: 'q3', correct: true },
      { questionId: 'q4', correct: true }, // lesson-2: first successful day
    ]

    const summary = await recordRetrievalResults('user-1', map, answers, TODAY)
    const byLesson = Object.fromEntries(summary.lessons.map((l) => [l.lessonId, l]))

    expect(byLesson['lesson-1']).toMatchObject({ promotedToMastered: true, masteryLevel: 'mastered' })
    expect(byLesson['lesson-2']).toMatchObject({ promotedToMastered: false, masteryLevel: 'proficient' })
  })
})

describe('markRetrievalQuizShown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setLastRetrievalQuizDate.mockResolvedValue(undefined)
  })

  it('marks today consumed (the skip path), so the quiz is gated for the rest of the day', async () => {
    await markRetrievalQuizShown('user-1', TODAY)
    expect(setLastRetrievalQuizDate).toHaveBeenCalledWith('user-1', '2026-01-10')
  })
})

describe('buildRetrievalQuiz', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMasteryProfile.mockResolvedValue({})
    getWeakConcepts.mockReturnValue([])
    collectTemplates.mockResolvedValue([])
    generatePracticeForLesson.mockImplementation(async (_uid: string, lessonId: string, count: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: `gen-${lessonId}-${i}`,
        type: 'readVector',
        prompt: 'p',
        order: i,
      })),
    )
  })

  it('returns nothing when no lessons are completed', async () => {
    const quiz = await buildRetrievalQuiz('user-1', {})
    expect(quiz.questions).toHaveLength(0)
    expect(quiz.questionLessonMap).toEqual({})
  })

  it('builds five interleaved, lesson-mapped questions from completed lessons only', async () => {
    const byLesson: Record<string, LessonProgress> = {
      'lesson-1': progress('lesson-1', { completed: true }),
      'lesson-2': progress('lesson-2', { completed: true }),
      'lesson-3': progress('lesson-3', { completed: false }),
    }

    const quiz = await buildRetrievalQuiz('user-1', byLesson)

    expect(quiz.questions).toHaveLength(5)
    // Only completed lessons contribute; the incomplete lesson-3 is never generated.
    expect(new Set(Object.values(quiz.questionLessonMap))).toEqual(new Set(['lesson-1', 'lesson-2']))
    expect(generatePracticeForLesson).not.toHaveBeenCalledWith('user-1', 'lesson-3', expect.anything())

    for (const question of quiz.questions) {
      expect(question.id.startsWith('retrieval-')).toBe(true)
      expect(quiz.questionLessonMap[question.id]).toBeDefined()
    }
    // Interleaved (round-robin), so adjacent questions come from different lessons.
    expect(quiz.questionLessonMap[quiz.questions[0].id]).not.toBe(
      quiz.questionLessonMap[quiz.questions[1].id],
    )
    // Display order is reassigned to the final sequence.
    quiz.questions.forEach((question, index) => expect(question.order).toBe(index))
  })

  it('biases more questions toward lessons with weak concepts', async () => {
    getWeakConcepts.mockReturnValue([{ concept: 'c2' }])
    collectTemplates.mockImplementation(async (lessonId: string) =>
      lessonId === 'lesson-2'
        ? [{ id: 't', type: 'readVector', conceptTags: ['c2'] }]
        : [{ id: 't', type: 'readVector', conceptTags: ['c1'] }],
    )
    const byLesson: Record<string, LessonProgress> = {
      'lesson-1': progress('lesson-1', { completed: true }),
      'lesson-2': progress('lesson-2', { completed: true }),
    }

    const quiz = await buildRetrievalQuiz('user-1', byLesson)
    const counts = quiz.questions.reduce<Record<string, number>>((acc, question) => {
      const lessonId = quiz.questionLessonMap[question.id]
      acc[lessonId] = (acc[lessonId] ?? 0) + 1
      return acc
    }, {})

    expect(counts['lesson-2']).toBeGreaterThan(counts['lesson-1'])
  })
})
