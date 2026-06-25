import { describe, it, expect } from 'vitest'
import {
  constructTarget,
  isReadyToSubmit,
  isVectorReversed,
  linearCombination,
  subtractTarget,
  validateConstructCombo,
  validateDrawVector,
  validateLinearCombo,
  validateMultipleChoice,
  validateQuestion,
  validateScalarMultiply,
  validateVectorSubtract,
} from './validation'
import type {
  ConstructComboQuestion,
  ConstructComboState,
  DrawVectorAnswer,
  DrawVectorQuestion,
  DrawVectorState,
  LinearComboQuestion,
  LinearComboState,
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

  it('gated question requires reverse, connect, draw, and correct typed difference', () => {
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

    // Full workflow: B reversed, −B connected to A's head, A − B drawn, and typed correctly.
    const full: VectorSubtractState = {
      type: 'vectorSubtract',
      vectorA: [4, 1],
      vectorB: [1, 3],
      negDisp: [-1, -3],
      negTail: [4, 1],
      sumTip: [3, -2],
      sumInput: [3, -2],
    }
    expect(validateVectorSubtract(question, full)).toBe(true)

    // Missing any single step fails the gated check.
    expect(validateVectorSubtract(question, { ...full, negDisp: [1, 3] })).toBe(false)
    expect(validateVectorSubtract(question, { ...full, negTail: [0, 0] })).toBe(false)
    expect(validateVectorSubtract(question, { ...full, sumTip: [0, 0] })).toBe(false)
    expect(validateVectorSubtract(question, { ...full, sumInput: [0, 0] })).toBe(false)
  })

  it('ungated question grades only the typed difference (reverse/connect/draw optional)', () => {
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

    // Correct typed answer with nothing reversed/connected/drawn -> still valid.
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

    // Wrong typed answer -> fails.
    expect(validateVectorSubtract(question, { ...onlyInput, sumInput: [0, 0] })).toBe(false)
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

  it('gated vectorSubtract is ready only after reverse, connect, draw, and entry', () => {
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

    // Reversed but not yet connected/drawn -> still not ready for a guided question.
    const reversed: VectorSubtractState = { ...notReversed, negDisp: [-1, -3] }
    expect(isReadyToSubmit(question, reversed)).toBe(false)

    // Full workflow complete -> ready.
    const complete: VectorSubtractState = { ...reversed, negTail: [4, 1], sumTip: [3, -2] }
    expect(isReadyToSubmit(question, complete)).toBe(true)
  })
})

describe('validateLinearCombo / linearCombination', () => {
  it('sums scaled base vectors', () => {
    expect(linearCombination([[1, 0], [0, 1]], [3, 2])).toEqual([3, 2])
    expect(linearCombination([[2, 1]], [-2])).toEqual([-4, -2])
  })

  const reachTwo: LinearComboQuestion = {
    id: 'lc1',
    type: 'linearCombo',
    mode: 'reach',
    prompt: 'reach',
    correctAnswer: {
      type: 'linearCombo',
      vectorA: [1, 0],
      vectorB: [0, 1],
      target: [3, 2],
      solution: [3, 2],
      reachable: true,
      tolerance: 0.2,
    },
    hint: 'h',
    explanation: 'e',
    order: 0,
  }

  it('reach mode: correct only when the combination lands on the target', () => {
    const onTarget: LinearComboState = { type: 'linearCombo', coefficients: [3, 2], reachableInput: null }
    const off: LinearComboState = { type: 'linearCombo', coefficients: [1, 1], reachableInput: null }
    expect(validateLinearCombo(reachTwo, onTarget)).toBe(true)
    expect(validateLinearCombo(reachTwo, off)).toBe(false)
    // Submit is gated on reaching the target.
    expect(isReadyToSubmit(reachTwo, onTarget)).toBe(true)
    expect(isReadyToSubmit(reachTwo, off)).toBe(false)
    expect(validateQuestion(reachTwo, onTarget)).toBe(true)
  })

  const reachable: LinearComboQuestion = {
    ...reachTwo,
    id: 'lc2',
    mode: 'reachable',
    correctAnswer: {
      type: 'linearCombo',
      vectorA: [2, 1],
      vectorB: [4, 2],
      target: [1, 3],
      reachable: false,
      tolerance: 0.2,
    },
  }

  it('reachable mode: graded on the yes/no verdict, not the sliders', () => {
    const sayNo: LinearComboState = { type: 'linearCombo', coefficients: [1, 1], reachableInput: 'no' }
    const sayYes: LinearComboState = { type: 'linearCombo', coefficients: [1, 1], reachableInput: 'yes' }
    const undecided: LinearComboState = { type: 'linearCombo', coefficients: [1, 1], reachableInput: null }
    expect(validateLinearCombo(reachable, sayNo)).toBe(true)
    expect(validateLinearCombo(reachable, sayYes)).toBe(false)
    expect(isReadyToSubmit(reachable, undecided)).toBe(false)
    expect(isReadyToSubmit(reachable, sayNo)).toBe(true)
  })

  const reachSequence: LinearComboQuestion = {
    ...reachTwo,
    id: 'lc3',
    correctAnswer: {
      type: 'linearCombo',
      vectorA: [1, 0],
      vectorB: [0, 1],
      target: [3, 2],
      target2: [-2, 1],
      reachable: true,
      tolerance: 0.2,
    },
  }

  it('reach mode with multiple targets: solved only after the final target is reached', () => {
    // On the first target but more remain — not yet solved.
    const onFirst: LinearComboState = {
      type: 'linearCombo',
      coefficients: [3, 2],
      reachableInput: null,
      targetIndex: 0,
    }
    expect(isReadyToSubmit(reachSequence, onFirst)).toBe(false)

    // Advanced to the final target and landed on it — solved.
    const onLast: LinearComboState = {
      type: 'linearCombo',
      coefficients: [-2, 1],
      reachableInput: null,
      targetIndex: 1,
    }
    expect(validateLinearCombo(reachSequence, onLast)).toBe(true)
    expect(isReadyToSubmit(reachSequence, onLast)).toBe(true)

    // On the final index but coefficients land on the wrong spot — not solved.
    const lastIndexWrongSpot: LinearComboState = {
      type: 'linearCombo',
      coefficients: [3, 2],
      reachableInput: null,
      targetIndex: 1,
    }
    expect(isReadyToSubmit(reachSequence, lastIndexWrongSpot)).toBe(false)
  })
})

describe('constructCombo: constructTarget / validateConstructCombo / isReadyToSubmit', () => {
  const vectorA: [number, number] = [2, 1]
  const vectorB: [number, number] = [1, 2]

  const gated: ConstructComboQuestion = {
    id: 'cc1',
    type: 'constructCombo',
    mode: 'construct',
    gated: true,
    prompt: 'Construct 2A + B',
    expressionLabel: '2A + B',
    correctAnswer: {
      type: 'constructCombo',
      vectorA,
      vectorB,
      coefA: 2,
      coefB: 1,
      target: [5, 4],
      tolerance: 0.2,
    },
    hint: '',
    explanation: '',
    order: 1,
  }

  const baseState: ConstructComboState = {
    type: 'constructCombo',
    vectorA,
    vectorB,
    aScale: 1,
    bScale: 1,
    bTail: [0, 0],
    resultTip: [0, 0],
    resultInput: [0, 0],
    coefAInput: 0,
    coefBInput: 0,
    reachableInput: null,
  }

  it('constructTarget computes coefA·A + coefB·B', () => {
    expect(constructTarget(gated.correctAnswer)).toEqual([5, 4])
  })

  it('gated construct requires every step plus the correct typed answer', () => {
    // Nothing done yet.
    expect(validateConstructCombo(gated, baseState)).toBe(false)
    expect(isReadyToSubmit(gated, baseState)).toBe(false)

    // Scaled A, scaled B, connected head-to-tail, drawn, but wrong typed answer.
    const drawnWrongInput: ConstructComboState = {
      ...baseState,
      aScale: 2,
      bScale: 1,
      bTail: [4, 2],
      resultTip: [5, 4],
      resultInput: [4, 4],
    }
    expect(isReadyToSubmit(gated, drawnWrongInput)).toBe(true)
    expect(validateConstructCombo(gated, drawnWrongInput)).toBe(false)

    // Everything correct.
    const solved: ConstructComboState = { ...drawnWrongInput, resultInput: [5, 4] }
    expect(validateConstructCombo(gated, solved)).toBe(true)
    expect(validateQuestion(gated, solved)).toBe(true)
  })

  it('ungated construct grades only the typed answer', () => {
    const ungated: ConstructComboQuestion = {
      ...gated,
      id: 'cc2',
      gated: false,
      correctAnswer: { ...gated.correctAnswer, coefA: 2, coefB: -1, target: [3, 0] },
    }
    // No graph work, just the correct typed answer.
    const typedOnly: ConstructComboState = { ...baseState, resultInput: [3, 0] }
    expect(isReadyToSubmit(ungated, typedOnly)).toBe(true)
    expect(validateConstructCombo(ungated, typedOnly)).toBe(true)

    const typedWrong: ConstructComboState = { ...baseState, resultInput: [3, 1] }
    expect(validateConstructCombo(ungated, typedWrong)).toBe(false)
  })

  it('findScalars grades the typed scalars c and d', () => {
    const findScalars: ConstructComboQuestion = {
      ...gated,
      id: 'cc4',
      mode: 'findScalars',
      gated: undefined,
      correctAnswer: { ...gated.correctAnswer, coefA: 1, coefB: 2, target: [4, 5] },
    }
    const empty: ConstructComboState = { ...baseState, coefAInput: 0, coefBInput: 0 }
    const right: ConstructComboState = { ...baseState, coefAInput: 1, coefBInput: 2 }
    const wrongD: ConstructComboState = { ...baseState, coefAInput: 1, coefBInput: 3 }

    expect(isReadyToSubmit(findScalars, empty)).toBe(false)
    expect(isReadyToSubmit(findScalars, right)).toBe(true)
    expect(validateConstructCombo(findScalars, right)).toBe(true)
    expect(validateConstructCombo(findScalars, wrongD)).toBe(false)
  })

  it('recognize grades the Yes/No verdict against reachability', () => {
    const recognize: ConstructComboQuestion = {
      ...gated,
      id: 'cc3',
      mode: 'recognize',
      gated: undefined,
      correctAnswer: { ...gated.correctAnswer, reachable: false, target: [3, 1] },
    }
    const undecided: ConstructComboState = { ...baseState, reachableInput: null }
    const sayNo: ConstructComboState = { ...baseState, reachableInput: 'no' }
    const sayYes: ConstructComboState = { ...baseState, reachableInput: 'yes' }

    expect(isReadyToSubmit(recognize, undecided)).toBe(false)
    expect(isReadyToSubmit(recognize, sayNo)).toBe(true)
    expect(validateConstructCombo(recognize, sayNo)).toBe(true)
    expect(validateConstructCombo(recognize, sayYes)).toBe(false)
  })
})
