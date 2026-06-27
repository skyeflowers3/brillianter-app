import { describe, expect, it } from 'vitest'
import { buildFeedbackRequest, compareAnswer } from './answerSummary'
import type { Question, QuestionInteractionState } from '../types/lesson'

function asQuestion(value: unknown): Question {
  return value as Question
}

function asState(value: unknown): QuestionInteractionState {
  return value as QuestionInteractionState
}

describe('compareAnswer', () => {
  it('returns raw vectors and summaries for a read-vector answer (swapped coords)', () => {
    const question = asQuestion({
      id: 'q',
      type: 'readVector',
      prompt: 'Read it',
      correctAnswer: { vector: [5, 2], tolerance: 0.3 },
      hint: '',
      explanation: '',
      order: 1,
    })
    const state = asState({ type: 'readVector', vectorInput: [2, 5] })

    const result = compareAnswer(question, state)
    expect(result).toEqual({
      submitted: [2, 5],
      correct: [5, 2],
      submittedSummary: 'entered (2, 5)',
      correctSummary: '(5, 2)',
    })
  })

  it('computes the correct difference for vector subtraction', () => {
    const question = asQuestion({
      id: 'q',
      type: 'vectorSubtract',
      gated: false,
      prompt: 'A - B',
      correctAnswer: { vectorA: [2, 3], vectorB: [3, 1], tolerance: 0.3 },
      hint: '',
      explanation: '',
      order: 1,
    })
    const state = asState({
      type: 'vectorSubtract',
      vectorA: [2, 3],
      vectorB: [3, 1],
      negDisp: [0, 0],
      negTail: [0, 0],
      sumTip: [0, 0],
      sumInput: [-1, 1],
    })

    const result = compareAnswer(question, state)
    expect(result?.correct).toEqual([-1, 2])
    expect(result?.correctSummary).toBe('(-1, 2)')
    expect(result?.submittedSummary).toBe('entered (-1, 1)')
  })

  it('summarizes a scalar answer without raw vectors', () => {
    const question = asQuestion({
      id: 'q',
      type: 'scalarSlider',
      mode: 'findScalar',
      prompt: 'Find c',
      correctAnswer: { baseVector: [1, 2], scalar: 3, tolerance: 0.2 },
      hint: '',
      explanation: '',
      order: 1,
    })
    const state = asState({
      type: 'scalarSlider',
      baseVector: [1, 2],
      scalar: 3,
      vectorInput: [0, 0],
      scalarInput: 2,
    })

    const result = compareAnswer(question, state)
    expect(result?.submitted).toBeUndefined()
    expect(result?.correct).toBeUndefined()
    expect(result?.submittedSummary).toBe('entered c = 2')
    expect(result?.correctSummary).toBe('c = 3')
  })

  it('returns null for multiple choice (no typed coordinate answer)', () => {
    const question = asQuestion({
      id: 'q',
      type: 'multipleChoice',
      prompt: 'Pick',
      options: [],
      correctAnswer: { correctOptionIds: ['o1'] },
      hint: '',
      explanation: '',
      order: 1,
    })
    const state = asState({ type: 'multipleChoice', selected: ['o2'] })
    expect(compareAnswer(question, state)).toBeNull()
  })
})

describe('buildFeedbackRequest', () => {
  it('builds a request carrying concept tags, attempts, and summaries', () => {
    const question = asQuestion({
      id: 'l1-q3',
      type: 'readVector',
      prompt: 'Read it',
      correctAnswer: { vector: [5, 2], tolerance: 0.3 },
      conceptTags: ['read-vector', 'coordinate-order', 'guided'],
      hint: '',
      explanation: '',
      order: 1,
    })
    const state = asState({ type: 'readVector', vectorInput: [2, 5] })

    const request = buildFeedbackRequest(question, state, 2, true)
    expect(request).toMatchObject({
      questionId: 'l1-q3',
      questionType: 'readVector',
      attempts: 2,
      usedHint: true,
      conceptTags: ['read-vector', 'coordinate-order', 'guided'],
      submitted: [2, 5],
      correct: [5, 2],
    })
  })

  it('returns null when there is no typed answer to diagnose', () => {
    const question = asQuestion({
      id: 'q',
      type: 'multipleChoice',
      prompt: 'Pick',
      options: [],
      correctAnswer: { correctOptionIds: ['o1'] },
      hint: '',
      explanation: '',
      order: 1,
    })
    const state = asState({ type: 'multipleChoice', selected: ['o2'] })
    expect(buildFeedbackRequest(question, state, 1, false)).toBeNull()
  })
})
