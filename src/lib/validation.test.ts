import { describe, it, expect } from 'vitest'
import {
  isReadyToSubmit,
  isVectorReversed,
  subtractTarget,
  validateDrawVector,
  validateMultipleChoice,
  validateQuestion,
  validateScalarMultiply,
  validateVectorSubtract,
} from './validation'
import type {
  DrawVectorAnswer,
  DrawVectorQuestion,
  DrawVectorState,
  MultipleChoiceAnswer,
  MultipleChoiceQuestion,
  MultipleChoiceState,
  ScalarMultiplyQuestion,
  ScalarMultiplyState,
  VectorSubtractAnswer,
  VectorSubtractQuestion,
  VectorSubtractState,
} from '../types/lesson'

describe('validateDrawVector / validateQuestion (drawVector)', () => {
  const answer: DrawVectorAnswer = { type: 'drawVector', target: [3, 4], tolerance: 0.3 }
  const question: DrawVectorQuestion = {
    id: 'd1',
    type: 'drawVector',
    prompt: 'Draw <3, 4>',
    correctAnswer: answer,
    hint: 'h',
    explanation: 'e',
    order: 0,
  }

  it('accepts a tip within tolerance of the target', () => {
    const state: DrawVectorState = { type: 'drawVector', tip: [3.1, 3.9] }
    expect(validateDrawVector(answer, state)).toBe(true)
    expect(validateQuestion(question, state)).toBe(true)
  })

  it('rejects a tip outside tolerance', () => {
    const state: DrawVectorState = { type: 'drawVector', tip: [1, 1] }
    expect(validateDrawVector(answer, state)).toBe(false)
    expect(validateQuestion(question, state)).toBe(false)
  })

  it('checks magnitude when specified', () => {
    const magAnswer: DrawVectorAnswer = { type: 'drawVector', magnitude: 5, tolerance: 0.2 }
    expect(validateDrawVector(magAnswer, { type: 'drawVector', tip: [3, 4] })).toBe(true)
    expect(validateDrawVector(magAnswer, { type: 'drawVector', tip: [1, 1] })).toBe(false)
  })
})

describe('validateMultipleChoice', () => {
  const answer: MultipleChoiceAnswer = {
    type: 'multipleChoice',
    correctOptionIds: ['a', 'c'],
  }

  it('accepts an exact set match (order-independent)', () => {
    const state: MultipleChoiceState = { type: 'multipleChoice', selected: ['c', 'a'] }
    expect(validateMultipleChoice(answer, state)).toBe(true)
  })

  it('rejects a missing selection', () => {
    const state: MultipleChoiceState = { type: 'multipleChoice', selected: ['a'] }
    expect(validateMultipleChoice(answer, state)).toBe(false)
  })

  it('rejects an extra (wrong) selection', () => {
    const state: MultipleChoiceState = { type: 'multipleChoice', selected: ['a', 'c', 'b'] }
    expect(validateMultipleChoice(answer, state)).toBe(false)
  })
})

describe('validateScalarMultiply', () => {
  it('findScalar mode grades the typed scalar', () => {
    const question: ScalarMultiplyQuestion = {
      id: 's1',
      type: 'scalarSlider',
      mode: 'findScalar',
      prompt: 'Find c',
      correctAnswer: { type: 'scalarSlider', baseVector: [1, 2], scalar: 3, tolerance: 0.2 },
      hint: 'h',
      explanation: 'e',
      order: 0,
    }

    const ok: ScalarMultiplyState = {
      type: 'scalarSlider',
      baseVector: [1, 2],
      scalar: 3,
      vectorInput: [0, 0],
      scalarInput: 3,
    }
    expect(validateScalarMultiply(question, ok)).toBe(true)

    const wrongInput: ScalarMultiplyState = { ...ok, scalarInput: 2 }
    expect(validateScalarMultiply(question, wrongInput)).toBe(false)

    const wrongSlider: ScalarMultiplyState = { ...ok, scalar: 1 }
    expect(validateScalarMultiply(question, wrongSlider)).toBe(false)
  })

  it('createVector mode grades the typed scaled vector', () => {
    const question: ScalarMultiplyQuestion = {
      id: 's2',
      type: 'scalarSlider',
      mode: 'createVector',
      prompt: 'Build 3A',
      correctAnswer: { type: 'scalarSlider', baseVector: [1, 2], scalar: 3, tolerance: 0.2 },
      hint: 'h',
      explanation: 'e',
      order: 0,
    }

    const ok: ScalarMultiplyState = {
      type: 'scalarSlider',
      baseVector: [1, 2],
      scalar: 3,
      vectorInput: [3, 6],
      scalarInput: 0,
    }
    expect(validateScalarMultiply(question, ok)).toBe(true)

    const wrongVector: ScalarMultiplyState = { ...ok, vectorInput: [3, 5] }
    expect(validateScalarMultiply(question, wrongVector)).toBe(false)
  })
})

describe('subtractTarget / isVectorReversed / validateVectorSubtract', () => {
  const answer: VectorSubtractAnswer = {
    type: 'vectorSubtract',
    vectorA: [4, 1],
    vectorB: [1, 3],
    tolerance: 0.3,
  }

  it('subtractTarget computes A + (-B)', () => {
    expect(subtractTarget(answer)).toEqual([3, -2])
  })

  it('isVectorReversed checks the -B displacement', () => {
    const reversed: VectorSubtractState = {
      type: 'vectorSubtract',
      vectorA: [4, 1],
      vectorB: [1, 3],
      negDisp: [-1, -3],
      negTail: [0, 0],
      sumTip: [0, 0],
      sumInput: [0, 0],
    }
    expect(isVectorReversed(answer, reversed)).toBe(true)

    const notReversed: VectorSubtractState = { ...reversed, negDisp: [1, 3] }
    expect(isVectorReversed(answer, notReversed)).toBe(false)
  })

  it('gated question requires reversal AND correct typed difference', () => {
    const question: VectorSubtractQuestion = {
      id: 'v1',
      type: 'vectorSubtract',
      gated: true,
      prompt: 'A - B',
      correctAnswer: answer,
      hint: 'h',
      explanation: 'e',
      order: 0,
    }

    const reversedAndCorrect: VectorSubtractState = {
      type: 'vectorSubtract',
      vectorA: [4, 1],
      vectorB: [1, 3],
      negDisp: [-1, -3],
      negTail: [0, 0],
      sumTip: [0, 0],
      sumInput: [3, -2],
    }
    expect(validateVectorSubtract(question, reversedAndCorrect)).toBe(true)

    // Correct typed answer but B never reversed -> gated check fails.
    const correctButNotReversed: VectorSubtractState = {
      ...reversedAndCorrect,
      negDisp: [1, 3],
    }
    expect(validateVectorSubtract(question, correctButNotReversed)).toBe(false)
  })

  it('ungated question grades only the typed difference', () => {
    const question: VectorSubtractQuestion = {
      id: 'v2',
      type: 'vectorSubtract',
      gated: false,
      prompt: 'A - B',
      correctAnswer: answer,
      hint: 'h',
      explanation: 'e',
      order: 0,
    }

    const onlyInput: VectorSubtractState = {
      type: 'vectorSubtract',
      vectorA: [4, 1],
      vectorB: [1, 3],
      negDisp: [1, 3],
      negTail: [0, 0],
      sumTip: [0, 0],
      sumInput: [3, -2],
    }
    expect(validateVectorSubtract(question, onlyInput)).toBe(true)
  })
})

describe('isReadyToSubmit', () => {
  it('multipleChoice is ready once any option is selected', () => {
    const question: MultipleChoiceQuestion = {
      id: 'm1',
      type: 'multipleChoice',
      prompt: 'pick',
      options: [{ id: 'a', label: 'A' }],
      correctAnswer: { type: 'multipleChoice', correctOptionIds: ['a'] },
      hint: 'h',
      explanation: 'e',
      order: 0,
    }

    expect(
      isReadyToSubmit(question, { type: 'multipleChoice', selected: [] }),
    ).toBe(false)
    expect(
      isReadyToSubmit(question, { type: 'multipleChoice', selected: ['a'] }),
    ).toBe(true)
  })

  it('gated vectorSubtract is not ready until B is reversed', () => {
    const question: VectorSubtractQuestion = {
      id: 'v3',
      type: 'vectorSubtract',
      gated: true,
      prompt: 'A - B',
      correctAnswer: { type: 'vectorSubtract', vectorA: [4, 1], vectorB: [1, 3], tolerance: 0.3 },
      hint: 'h',
      explanation: 'e',
      order: 0,
    }

    const notReversed: VectorSubtractState = {
      type: 'vectorSubtract',
      vectorA: [4, 1],
      vectorB: [1, 3],
      negDisp: [1, 3],
      negTail: [0, 0],
      sumTip: [0, 0],
      sumInput: [3, -2],
    }
    expect(isReadyToSubmit(question, notReversed)).toBe(false)

    const reversed: VectorSubtractState = { ...notReversed, negDisp: [-1, -3] }
    expect(isReadyToSubmit(question, reversed)).toBe(true)
  })
})
