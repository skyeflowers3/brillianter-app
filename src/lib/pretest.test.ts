import { describe, expect, it } from 'vitest'
import type { Question, QuestionInteractionState } from '../types/lesson'
import {
  expectedVector,
  extractGuessVector,
  hasCommittedAttempt,
  isCloseGuess,
  isCorrectGuess,
} from './pretest'

// Minimal renderable questions for each supported pretest type. Fields unused by the pure
// helpers (hint/explanation/order) are filled with harmless defaults.
const base = { hint: '', explanation: '', order: 0 }

const drawVector: Question = {
  ...base,
  id: 'pt-draw',
  type: 'drawVector',
  prompt: 'Draw (4, 3).',
  correctAnswer: { type: 'drawVector', target: [4, 3], tolerance: 0.5 },
}

const headToTailFree: Question = {
  ...base,
  id: 'pt-add',
  type: 'headToTailFree',
  prompt: 'a + b?',
  correctAnswer: { type: 'headToTailFree', vectorA: [3, 1], vectorB: [1, 2], tolerance: 0.5 },
}

const vectorSubtract: Question = {
  ...base,
  id: 'pt-sub',
  type: 'vectorSubtract',
  gated: false,
  prompt: 'a - b?',
  correctAnswer: { type: 'vectorSubtract', vectorA: [4, 3], vectorB: [1, 2], tolerance: 0.5 },
}

const scalarSlider: Question = {
  ...base,
  id: 'pt-scalar',
  type: 'scalarSlider',
  mode: 'vector',
  gated: false,
  prompt: '2 v?',
  correctAnswer: { type: 'scalarSlider', baseVector: [2, 1], scalar: 2, tolerance: 0.1 },
}

const constructCombo: Question = {
  ...base,
  id: 'pt-combo',
  type: 'constructCombo',
  mode: 'construct',
  gated: false,
  prompt: '3a + b?',
  correctAnswer: {
    type: 'constructCombo',
    vectorA: [1, 1],
    vectorB: [1, -1],
    coefA: 3,
    coefB: 1,
    target: [4, 2],
    tolerance: 0.5,
  },
}

function drawState(tip: [number, number]): QuestionInteractionState {
  return { type: 'drawVector', tip }
}

function headToTailFreeState(sumInput: [number, number]): QuestionInteractionState {
  return {
    type: 'headToTailFree',
    vectorA: [3, 1],
    vectorB: [1, 2],
    bTail: [0, 0],
    sumTip: [0, 0],
    sumInput,
  }
}

function vectorSubtractState(sumInput: [number, number]): QuestionInteractionState {
  return {
    type: 'vectorSubtract',
    vectorA: [4, 3],
    vectorB: [1, 2],
    negDisp: [-1, -2],
    negTail: [0, 0],
    sumTip: [0, 0],
    sumInput,
  }
}

function scalarState(scalar: number): QuestionInteractionState {
  return {
    type: 'scalarSlider',
    baseVector: [2, 1],
    scalar,
    vectorInput: [0, 0],
    scalarInput: 0,
  }
}

function constructComboState(resultInput: [number, number]): QuestionInteractionState {
  return {
    type: 'constructCombo',
    vectorA: [1, 1],
    vectorB: [1, -1],
    aScale: 1,
    bScale: 1,
    bTail: [0, 0],
    resultTip: [0, 0],
    resultInput,
    coefAInput: 0,
    coefBInput: 0,
    reachableInput: null,
  }
}

describe('expectedVector', () => {
  it('returns the target for drawVector', () => {
    expect(expectedVector(drawVector)).toEqual([4, 3])
  })

  it('returns A + B for headToTailFree', () => {
    expect(expectedVector(headToTailFree)).toEqual([4, 3])
  })

  it('returns A - B for vectorSubtract', () => {
    expect(expectedVector(vectorSubtract)).toEqual([3, 1])
  })

  it('returns scalar * base for scalarSlider', () => {
    expect(expectedVector(scalarSlider)).toEqual([4, 2])
  })

  it('returns coefA*A + coefB*B for constructCombo', () => {
    expect(expectedVector(constructCombo)).toEqual([4, 2])
  })
})

describe('extractGuessVector', () => {
  it('reads tip for drawVector', () => {
    expect(extractGuessVector(drawVector, drawState([2, 5]))).toEqual([2, 5])
  })

  it('reads sumInput for headToTailFree', () => {
    expect(extractGuessVector(headToTailFree, headToTailFreeState([1, 1]))).toEqual([1, 1])
  })

  it('reads sumInput for vectorSubtract', () => {
    expect(extractGuessVector(vectorSubtract, vectorSubtractState([2, 0]))).toEqual([2, 0])
  })

  it('computes scalar * base for scalarSlider', () => {
    expect(extractGuessVector(scalarSlider, scalarState(3))).toEqual([6, 3])
  })

  it('reads resultInput for constructCombo', () => {
    expect(extractGuessVector(constructCombo, constructComboState([5, 1]))).toEqual([5, 1])
  })
})

describe('hasCommittedAttempt', () => {
  it('is false at the initial (untouched) state and true once the graded field moves', () => {
    expect(hasCommittedAttempt(drawVector, drawState([0, 0]))).toBe(false)
    expect(hasCommittedAttempt(drawVector, drawState([1, 0]))).toBe(true)

    expect(hasCommittedAttempt(headToTailFree, headToTailFreeState([0, 0]))).toBe(false)
    expect(hasCommittedAttempt(headToTailFree, headToTailFreeState([4, 3]))).toBe(true)

    expect(hasCommittedAttempt(vectorSubtract, vectorSubtractState([0, 0]))).toBe(false)
    expect(hasCommittedAttempt(vectorSubtract, vectorSubtractState([3, 1]))).toBe(true)

    // scalarSlider starts at the identity scalar (1); moving off it is the attempt.
    expect(hasCommittedAttempt(scalarSlider, scalarState(1))).toBe(false)
    expect(hasCommittedAttempt(scalarSlider, scalarState(2))).toBe(true)

    expect(hasCommittedAttempt(constructCombo, constructComboState([0, 0]))).toBe(false)
    expect(hasCommittedAttempt(constructCombo, constructComboState([4, 2]))).toBe(true)
  })

  it('is false when the question and state types disagree', () => {
    expect(hasCommittedAttempt(drawVector, scalarState(2))).toBe(false)
  })
})

describe('isCloseGuess', () => {
  it('is true within the closeThreshold band and false outside it', () => {
    // exact answer is (4, 3); guess (5, 3) is distance 1 away.
    expect(isCloseGuess(drawVector, drawState([5, 3]), 1.5)).toBe(true)
    expect(isCloseGuess(drawVector, drawState([5, 3]), 0.5)).toBe(false)
  })

  it('treats a far guess as not close', () => {
    expect(isCloseGuess(scalarSlider, scalarState(-3), 1.5)).toBe(false)
  })

  it('counts an exact guess as close', () => {
    expect(isCloseGuess(constructCombo, constructComboState([4, 2]), 1.5)).toBe(true)
  })
})

describe('isCorrectGuess', () => {
  it('is true within the grading tolerance and false outside it', () => {
    // exact answer is (4, 3), tolerance 0.5.
    expect(isCorrectGuess(drawVector, drawState([4, 3]))).toBe(true)
    expect(isCorrectGuess(drawVector, drawState([4.3, 3]))).toBe(true)
    // distance 1 away: close but not correct.
    expect(isCorrectGuess(drawVector, drawState([5, 3]))).toBe(false)
  })

  it('uses each type tolerance (scalarSlider is tighter at 0.1)', () => {
    expect(isCorrectGuess(scalarSlider, scalarState(2))).toBe(true)
    // scalar 2.5 -> (5, 2.5), distance ~1.12 from (4, 2): outside the 0.1 tolerance.
    expect(isCorrectGuess(scalarSlider, scalarState(2.5))).toBe(false)
  })

  it('confirms an exact construct-combo guess', () => {
    expect(isCorrectGuess(constructCombo, constructComboState([4, 2]))).toBe(true)
  })
})
