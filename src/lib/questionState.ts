import type {
  FindMagnitudeQuestion,
  ReadVectorQuestion,
  HeadToTailAddQuestion,
  HeadToTailConnectQuestion,
  HeadToTailDrawSumQuestion,
  HeadToTailFullQuestion,
  HeadToTailFreeQuestion,
  NegateVectorQuestion,
  LinearComboQuestion,
  ConstructComboQuestion,
  Question,
  QuestionInteractionState,
  ScalarMultiplyQuestion,
  VectorSubtractQuestion,
} from '../types/lesson'
import {
  presetVectorA,
  presetVectorB,
} from './headToTailSteps'
import { INITIAL_SCALAR, presetBaseVector } from './scalarMultiply'
import { equalsWithTolerance, type Vec2 } from './vectorMath'

const INITIAL_SUM_TIP: Vec2 = [0, 0]
const INITIAL_SUM_INPUT: Vec2 = [0, 0]

export function createHeadToTailState(question: HeadToTailAddQuestion): QuestionInteractionState {
  return {
    type: 'headToTailAdd',
    step: 'drawSum',
    vectorA: presetVectorA(question),
    vectorB: presetVectorB(question),
    sumTip: [...INITIAL_SUM_TIP],
    sumInput: [...INITIAL_SUM_INPUT],
  }
}

export function createScalarMultiplyState(
  question: ScalarMultiplyQuestion,
): QuestionInteractionState {
  return {
    type: 'scalarSlider',
    baseVector: presetBaseVector(question),
    scalar: INITIAL_SCALAR,
    vectorInput: [0, 0],
    scalarInput: 0,
  }
}

export function createMultipleChoiceState(): QuestionInteractionState {
  return {
    type: 'multipleChoice',
    selected: [],
  }
}

export function createLinearComboState(
  question: LinearComboQuestion,
): QuestionInteractionState {
  const count = question.correctAnswer.vectorB ? 2 : 1
  return {
    type: 'linearCombo',
    // Start every coefficient at 1 so each base vector is visible from the outset.
    coefficients: Array.from({ length: count }, () => 1),
    reachableInput: null,
    targetIndex: 0,
  }
}

export function createConstructComboState(
  question: ConstructComboQuestion,
): QuestionInteractionState {
  return {
    type: 'constructCombo',
    vectorA: [...question.correctAnswer.vectorA],
    vectorB: [...question.correctAnswer.vectorB],
    // Start both scale factors at 1 so A and B are visible at full length from the outset.
    aScale: 1,
    bScale: 1,
    bTail: [0, 0],
    resultTip: [0, 0],
    resultInput: [0, 0],
    coefAInput: 0,
    coefBInput: 0,
    reachableInput: null,
  }
}

export function createReadVectorState(_question: ReadVectorQuestion): QuestionInteractionState {
  void _question
  return {
    type: 'readVector',
    vectorInput: [0, 0],
  }
}

export function createFindMagnitudeState(
  _question: FindMagnitudeQuestion,
): QuestionInteractionState {
  void _question
  return {
    type: 'findMagnitude',
    magnitudeInput: 0,
  }
}

export function createHeadToTailConnectState(
  question: HeadToTailConnectQuestion,
): QuestionInteractionState {
  return {
    type: 'headToTailConnect',
    vectorA: [...question.correctAnswer.vectorA],
    vectorB: [...question.correctAnswer.vectorB],
    bTail: [0, 0],
    endInput: [0, 0],
  }
}

export function createHeadToTailDrawSumState(
  question: HeadToTailDrawSumQuestion,
): QuestionInteractionState {
  return {
    type: 'headToTailDrawSum',
    vectorA: [...question.correctAnswer.vectorA],
    vectorB: [...question.correctAnswer.vectorB],
    sumTip: [0, 0],
    sumInput: [0, 0],
  }
}

export function createHeadToTailFullState(
  question: HeadToTailFullQuestion,
): QuestionInteractionState {
  return {
    type: 'headToTailFull',
    vectorA: [...question.correctAnswer.vectorA],
    vectorB: [...question.correctAnswer.vectorB],
    bTail: [0, 0],
    sumTip: [0, 0],
    sumInput: [0, 0],
  }
}

export function createHeadToTailFreeState(
  question: HeadToTailFreeQuestion,
): QuestionInteractionState {
  return {
    type: 'headToTailFree',
    vectorA: [...question.correctAnswer.vectorA],
    vectorB: [...question.correctAnswer.vectorB],
    bTail: [0, 0],
    sumTip: [0, 0],
    sumInput: [0, 0],
  }
}

export function createNegateVectorState(
  question: NegateVectorQuestion,
): QuestionInteractionState {
  return {
    type: 'negateVector',
    baseVector: [...question.correctAnswer.baseVector],
    // The arrow starts pointing at B; the learner drags its tip across to −B.
    tip: [...question.correctAnswer.baseVector],
    vectorInput: [0, 0],
  }
}

export function createVectorSubtractState(
  question: VectorSubtractQuestion,
): QuestionInteractionState {
  return {
    type: 'vectorSubtract',
    vectorA: [...question.correctAnswer.vectorA],
    vectorB: [...question.correctAnswer.vectorB],
    // The −B arrow starts as B (un-reversed); the learner reverses it with the "Reverse B" button.
    negDisp: [...question.correctAnswer.vectorB],
    negTail: [0, 0],
    sumTip: [0, 0],
    sumInput: [0, 0],
  }
}

export function createInitialQuestionState(question: Question): QuestionInteractionState {
  if (question.type === 'headToTailAdd') {
    return createHeadToTailState(question)
  }

  if (question.type === 'scalarSlider') {
    return createScalarMultiplyState(question)
  }

  if (question.type === 'headToTailConnect') {
    return createHeadToTailConnectState(question)
  }

  if (question.type === 'headToTailDrawSum') {
    return createHeadToTailDrawSumState(question)
  }

  if (question.type === 'headToTailFull') {
    return createHeadToTailFullState(question)
  }

  if (question.type === 'headToTailFree') {
    return createHeadToTailFreeState(question)
  }

  if (question.type === 'multipleChoice') {
    return createMultipleChoiceState()
  }

  if (question.type === 'readVector') {
    return createReadVectorState(question)
  }

  if (question.type === 'findMagnitude') {
    return createFindMagnitudeState(question)
  }

  if (question.type === 'negateVector') {
    return createNegateVectorState(question)
  }

  if (question.type === 'vectorSubtract') {
    return createVectorSubtractState(question)
  }

  if (question.type === 'linearCombo') {
    return createLinearComboState(question)
  }

  if (question.type === 'constructCombo') {
    return createConstructComboState(question)
  }

  return {
    type: 'drawVector',
    tip: [0, 0],
  }
}

export function restoreQuestionState(
  question: Question,
  saved: QuestionInteractionState | undefined,
  legacyTip?: Vec2,
): QuestionInteractionState {
  if (question.type === 'headToTailAdd') {
    const presetA = presetVectorA(question)
    const presetB = presetVectorB(question)

    if (saved?.type === 'headToTailAdd') {
      return {
        type: 'headToTailAdd',
        step: 'drawSum',
        vectorA: presetA,
        vectorB: presetB,
        sumTip: [...saved.sumTip],
        sumInput: [...(saved.sumInput ?? INITIAL_SUM_INPUT)],
      }
    }

    return createHeadToTailState(question)
  }

  if (question.type === 'scalarSlider') {
    if (saved?.type === 'scalarSlider') {
      return {
        type: 'scalarSlider',
        baseVector: presetBaseVector(question),
        scalar: saved.scalar,
        vectorInput: [...(saved.vectorInput ?? [0, 0])],
        scalarInput: saved.scalarInput ?? 0,
      }
    }

    return createScalarMultiplyState(question)
  }

  if (question.type === 'multipleChoice') {
    if (saved?.type === 'multipleChoice') {
      return {
        type: 'multipleChoice',
        selected: [...saved.selected],
      }
    }

    return createMultipleChoiceState()
  }

  if (question.type === 'readVector') {
    if (saved?.type === 'readVector') {
      return { type: 'readVector', vectorInput: [...saved.vectorInput] }
    }

    return createReadVectorState(question)
  }

  if (question.type === 'findMagnitude') {
    if (saved?.type === 'findMagnitude') {
      return { type: 'findMagnitude', magnitudeInput: saved.magnitudeInput }
    }

    return createFindMagnitudeState(question)
  }

  if (question.type === 'headToTailConnect') {
    if (saved?.type === 'headToTailConnect') {
      return {
        type: 'headToTailConnect',
        vectorA: [...question.correctAnswer.vectorA],
        vectorB: [...question.correctAnswer.vectorB],
        bTail: [...saved.bTail],
        endInput: [...(saved.endInput ?? [0, 0])],
      }
    }

    return createHeadToTailConnectState(question)
  }

  if (question.type === 'headToTailDrawSum') {
    if (saved?.type === 'headToTailDrawSum') {
      return {
        type: 'headToTailDrawSum',
        vectorA: [...question.correctAnswer.vectorA],
        vectorB: [...question.correctAnswer.vectorB],
        sumTip: [...saved.sumTip],
        sumInput: [...(saved.sumInput ?? [0, 0])],
      }
    }

    return createHeadToTailDrawSumState(question)
  }

  if (question.type === 'headToTailFull') {
    if (saved?.type === 'headToTailFull') {
      return {
        type: 'headToTailFull',
        vectorA: [...question.correctAnswer.vectorA],
        vectorB: [...question.correctAnswer.vectorB],
        bTail: [...saved.bTail],
        sumTip: [...saved.sumTip],
        sumInput: [...(saved.sumInput ?? [0, 0])],
      }
    }

    return createHeadToTailFullState(question)
  }

  if (question.type === 'headToTailFree') {
    if (saved?.type === 'headToTailFree') {
      return {
        type: 'headToTailFree',
        vectorA: [...question.correctAnswer.vectorA],
        vectorB: [...question.correctAnswer.vectorB],
        bTail: [...saved.bTail],
        sumTip: [...saved.sumTip],
        sumInput: [...(saved.sumInput ?? [0, 0])],
      }
    }

    return createHeadToTailFreeState(question)
  }

  if (question.type === 'negateVector') {
    if (saved?.type === 'negateVector') {
      return {
        type: 'negateVector',
        baseVector: [...question.correctAnswer.baseVector],
        tip: [...saved.tip],
        vectorInput: [...(saved.vectorInput ?? [0, 0])],
      }
    }

    return createNegateVectorState(question)
  }

  if (question.type === 'vectorSubtract') {
    if (saved?.type === 'vectorSubtract') {
      return {
        type: 'vectorSubtract',
        vectorA: [...question.correctAnswer.vectorA],
        vectorB: [...question.correctAnswer.vectorB],
        negDisp: [...saved.negDisp],
        negTail: [...saved.negTail],
        sumTip: [...saved.sumTip],
        sumInput: [...(saved.sumInput ?? [0, 0])],
      }
    }

    return createVectorSubtractState(question)
  }

  if (question.type === 'linearCombo') {
    const count = question.correctAnswer.vectorB ? 2 : 1
    if (saved?.type === 'linearCombo' && saved.coefficients.length === count) {
      return {
        type: 'linearCombo',
        coefficients: [...saved.coefficients],
        reachableInput: saved.reachableInput ?? null,
        targetIndex: saved.targetIndex ?? 0,
      }
    }

    return createLinearComboState(question)
  }

  if (question.type === 'constructCombo') {
    if (saved?.type === 'constructCombo') {
      return {
        type: 'constructCombo',
        vectorA: [...question.correctAnswer.vectorA],
        vectorB: [...question.correctAnswer.vectorB],
        aScale: saved.aScale ?? 1,
        bScale: saved.bScale ?? 1,
        bTail: [...(saved.bTail ?? [0, 0])],
        resultTip: [...(saved.resultTip ?? [0, 0])],
        resultInput: [...(saved.resultInput ?? [0, 0])],
        coefAInput: saved.coefAInput ?? 0,
        coefBInput: saved.coefBInput ?? 0,
        reachableInput: saved.reachableInput ?? null,
      }
    }

    return createConstructComboState(question)
  }

  if (saved?.type === 'drawVector') {
    return { type: 'drawVector', tip: [...saved.tip] }
  }

  if (legacyTip) {
    return { type: 'drawVector', tip: [...legacyTip] }
  }

  return createInitialQuestionState(question)
}

export function questionStatesEqual(
  a: QuestionInteractionState,
  b: QuestionInteractionState,
  tolerance = 0.05,
): boolean {
  if (a.type !== b.type) {
    return false
  }

  if (a.type === 'drawVector' && b.type === 'drawVector') {
    return equalsWithTolerance(a.tip, b.tip, tolerance)
  }

  if (a.type === 'readVector' && b.type === 'readVector') {
    return equalsWithTolerance(a.vectorInput, b.vectorInput, tolerance)
  }

  if (a.type === 'findMagnitude' && b.type === 'findMagnitude') {
    return Math.abs(a.magnitudeInput - b.magnitudeInput) <= tolerance
  }

  if (a.type === 'headToTailAdd' && b.type === 'headToTailAdd') {
    return (
      equalsWithTolerance(a.sumTip, b.sumTip, tolerance) &&
      equalsWithTolerance(a.sumInput, b.sumInput, tolerance)
    )
  }

  if (a.type === 'scalarSlider' && b.type === 'scalarSlider') {
    return (
      Math.abs(a.scalar - b.scalar) <= tolerance &&
      equalsWithTolerance(a.vectorInput, b.vectorInput, tolerance) &&
      Math.abs(a.scalarInput - b.scalarInput) <= tolerance
    )
  }

  if (a.type === 'multipleChoice' && b.type === 'multipleChoice') {
    if (a.selected.length !== b.selected.length) {
      return false
    }
    const setB = new Set(b.selected)
    return a.selected.every((id) => setB.has(id))
  }

  if (a.type === 'headToTailConnect' && b.type === 'headToTailConnect') {
    return (
      equalsWithTolerance(a.bTail, b.bTail, tolerance) &&
      equalsWithTolerance(a.endInput, b.endInput, tolerance)
    )
  }

  if (a.type === 'headToTailDrawSum' && b.type === 'headToTailDrawSum') {
    return (
      equalsWithTolerance(a.sumTip, b.sumTip, tolerance) &&
      equalsWithTolerance(a.sumInput, b.sumInput, tolerance)
    )
  }

  if (a.type === 'headToTailFull' && b.type === 'headToTailFull') {
    return (
      equalsWithTolerance(a.bTail, b.bTail, tolerance) &&
      equalsWithTolerance(a.sumTip, b.sumTip, tolerance) &&
      equalsWithTolerance(a.sumInput, b.sumInput, tolerance)
    )
  }

  if (a.type === 'headToTailFree' && b.type === 'headToTailFree') {
    return (
      equalsWithTolerance(a.bTail, b.bTail, tolerance) &&
      equalsWithTolerance(a.sumTip, b.sumTip, tolerance) &&
      equalsWithTolerance(a.sumInput, b.sumInput, tolerance)
    )
  }

  if (a.type === 'negateVector' && b.type === 'negateVector') {
    return (
      equalsWithTolerance(a.tip, b.tip, tolerance) &&
      equalsWithTolerance(a.vectorInput, b.vectorInput, tolerance)
    )
  }

  if (a.type === 'vectorSubtract' && b.type === 'vectorSubtract') {
    return (
      equalsWithTolerance(a.negDisp, b.negDisp, tolerance) &&
      equalsWithTolerance(a.negTail, b.negTail, tolerance) &&
      equalsWithTolerance(a.sumTip, b.sumTip, tolerance) &&
      equalsWithTolerance(a.sumInput, b.sumInput, tolerance)
    )
  }

  if (a.type === 'linearCombo' && b.type === 'linearCombo') {
    return (
      a.reachableInput === b.reachableInput &&
      (a.targetIndex ?? 0) === (b.targetIndex ?? 0) &&
      a.coefficients.length === b.coefficients.length &&
      a.coefficients.every((value, index) => Math.abs(value - b.coefficients[index]) <= tolerance)
    )
  }

  if (a.type === 'constructCombo' && b.type === 'constructCombo') {
    return (
      a.reachableInput === b.reachableInput &&
      Math.abs(a.aScale - b.aScale) <= tolerance &&
      Math.abs(a.bScale - b.bScale) <= tolerance &&
      Math.abs(a.coefAInput - b.coefAInput) <= tolerance &&
      Math.abs(a.coefBInput - b.coefBInput) <= tolerance &&
      equalsWithTolerance(a.bTail, b.bTail, tolerance) &&
      equalsWithTolerance(a.resultTip, b.resultTip, tolerance) &&
      equalsWithTolerance(a.resultInput, b.resultInput, tolerance)
    )
  }

  return false
}

export function getSubmitHintMessage(state: QuestionInteractionState): string {
  if (state.type === 'headToTailAdd') {
    return 'Change the drawn vector or typed values to submit a new answer.'
  }

  if (state.type === 'scalarSlider') {
    return 'Adjust the vector or your typed answer to submit again.'
  }

  if (state.type === 'multipleChoice') {
    return 'Change your selection to submit a new answer.'
  }

  if (state.type === 'readVector') {
    return 'Change the vector components to submit a new answer.'
  }

  if (state.type === 'findMagnitude') {
    return 'Change the magnitude to submit a new answer.'
  }

  if (state.type === 'headToTailConnect') {
    return 'Connect b head-to-tail and enter the endpoint to submit a new answer.'
  }

  if (state.type === 'headToTailDrawSum') {
    return 'Draw a + b and enter the sum to submit a new answer.'
  }

  if (state.type === 'headToTailFull') {
    return 'Align b, draw a + b, and enter the sum to submit a new answer.'
  }

  if (state.type === 'headToTailFree') {
    return 'Enter the a + b components to submit a new answer.'
  }

  if (state.type === 'negateVector') {
    return 'Reverse the arrow and enter −B to submit a new answer.'
  }

  if (state.type === 'vectorSubtract') {
    return 'Enter the A − B components to submit a new answer.'
  }

  if (state.type === 'constructCombo') {
    return state.reachableInput !== null
      ? 'Change your Yes/No answer to submit again.'
      : 'Adjust the construction or your typed answer to submit again.'
  }

  return 'Move the vector to submit a new answer.'
}
