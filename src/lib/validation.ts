import type {
  DrawVectorAnswer,
  DrawVectorState,
  HeadToTailAddAnswer,
  HeadToTailAddState,
  HeadToTailConnectAnswer,
  HeadToTailConnectState,
  HeadToTailDrawSumAnswer,
  HeadToTailDrawSumState,
  HeadToTailFullAnswer,
  HeadToTailFullState,
  HeadToTailFreeAnswer,
  HeadToTailFreeState,
  MultipleChoiceAnswer,
  MultipleChoiceState,
  NegateVectorAnswer,
  NegateVectorState,
  Question,
  QuestionInteractionState,
  ScalarMultiplyAnswer,
  ScalarMultiplyQuestion,
  ScalarMultiplyState,
  VectorSubtractAnswer,
  VectorSubtractState,
} from '../types/lesson'
import { add, equalsWithTolerance, magnitude, scale, type Vec2 } from './vectorMath'

export function validateDrawVector(
  answer: DrawVectorAnswer,
  state: DrawVectorState,
): boolean {
  const tip = state.tip

  if (answer.target) {
    if (!equalsWithTolerance(tip, answer.target, answer.tolerance)) {
      return false
    }
  }

  if (answer.magnitude !== undefined) {
    const length = magnitude(tip)
    if (Math.abs(length - answer.magnitude) > answer.tolerance) {
      return false
    }
  }

  return true
}

export type HeadToTailAddIncorrectReason = 'vector' | 'input' | 'both'

export function getHeadToTailAddIncorrectReason(
  answer: HeadToTailAddAnswer,
  state: HeadToTailAddState,
): HeadToTailAddIncorrectReason | null {
  if (!answer.targetSum) {
    return null
  }

  const vectorCorrect = equalsWithTolerance(state.sumTip, answer.targetSum, answer.tolerance)
  const inputCorrect = equalsWithTolerance(state.sumInput, answer.targetSum, answer.tolerance)

  if (vectorCorrect && inputCorrect) {
    return null
  }

  if (!vectorCorrect && !inputCorrect) {
    return 'both'
  }

  if (!vectorCorrect) {
    return 'vector'
  }

  return 'input'
}

export function getHeadToTailAddIncorrectMessage(
  reason: HeadToTailAddIncorrectReason,
  locked: boolean,
): string {
  if (locked) {
    switch (reason) {
      case 'vector':
        return 'Not quite. The drawn a + b vector on the graph is off. Review the explanation below, then continue.'
      case 'input':
        return 'Not quite. The a + b values you typed are off. Review the explanation below, then continue.'
      case 'both':
        return 'Not quite. Both the drawn vector and the typed answer need work. Review the explanation below, then continue.'
    }
  }

  switch (reason) {
    case 'vector':
      return 'Not quite. The drawn a + b vector on the graph is off. Adjust it and try again, or read the hint.'
    case 'input':
      return 'Not quite. The a + b values you typed are off. Fix the inputs and try again, or read the hint.'
    case 'both':
      return 'Not quite. Both the drawn vector and the typed answer need work. Try again or read the hint.'
  }
}

export function validateHeadToTailAdd(
  answer: HeadToTailAddAnswer,
  state: HeadToTailAddState,
): boolean {
  if (answer.vectorA) {
    if (!equalsWithTolerance(state.vectorA, answer.vectorA, answer.tolerance)) {
      return false
    }
  }

  if (answer.vectorB) {
    if (!equalsWithTolerance(state.vectorB, answer.vectorB, answer.tolerance)) {
      return false
    }
  }

  if (answer.targetSum) {
    return (
      equalsWithTolerance(state.sumTip, answer.targetSum, answer.tolerance) &&
      equalsWithTolerance(state.sumInput, answer.targetSum, answer.tolerance)
    )
  }

  return true
}

/** Vector tolerance for the typed scaled vector (components are integers here). */
const SCALAR_VECTOR_TOLERANCE = 0.35

/** Whether the slider has been dragged to (near) the correct scalar. */
export function isScalarSliderCorrect(
  answer: ScalarMultiplyAnswer,
  state: ScalarMultiplyState,
): boolean {
  return Math.abs(state.scalar - answer.scalar) <= answer.tolerance
}

export function validateScalarMultiply(
  question: ScalarMultiplyQuestion,
  state: ScalarMultiplyState,
): boolean {
  const answer = question.correctAnswer

  if (!isScalarSliderCorrect(answer, state)) {
    return false
  }

  if (question.mode === 'findScalar') {
    return Math.abs(state.scalarInput - answer.scalar) <= answer.tolerance
  }

  const target = scale(answer.baseVector, answer.scalar)
  return equalsWithTolerance(state.vectorInput, target, SCALAR_VECTOR_TOLERANCE)
}

export function validateMultipleChoice(
  answer: MultipleChoiceAnswer,
  state: MultipleChoiceState,
): boolean {
  const correct = new Set(answer.correctOptionIds)
  const selected = new Set(state.selected)

  if (correct.size !== selected.size) {
    return false
  }

  for (const id of selected) {
    if (!correct.has(id)) {
      return false
    }
  }

  return true
}

export function isHeadToTailConnected(
  answer: HeadToTailConnectAnswer,
  state: HeadToTailConnectState,
): boolean {
  // B's tail snaps to A's head (A's tail is at the origin, so head(A) === vectorA).
  return equalsWithTolerance(state.bTail, answer.vectorA, answer.tolerance)
}

export function validateHeadToTailConnect(
  answer: HeadToTailConnectAnswer,
  state: HeadToTailConnectState,
): boolean {
  const connected = isHeadToTailConnected(answer, state)
  const endpointCorrect = equalsWithTolerance(
    state.endInput,
    add(answer.vectorA, answer.vectorB),
    answer.tolerance,
  )
  return connected && endpointCorrect
}

export function isHeadToTailSumDrawn(
  answer: HeadToTailDrawSumAnswer,
  state: HeadToTailDrawSumState,
): boolean {
  return equalsWithTolerance(state.sumTip, add(answer.vectorA, answer.vectorB), answer.tolerance)
}

export function validateHeadToTailDrawSum(
  answer: HeadToTailDrawSumAnswer,
  state: HeadToTailDrawSumState,
): boolean {
  const target = add(answer.vectorA, answer.vectorB)
  const drawnCorrect = equalsWithTolerance(state.sumTip, target, answer.tolerance)
  const inputCorrect = equalsWithTolerance(state.sumInput, target, answer.tolerance)
  return drawnCorrect && inputCorrect
}

export function isHeadToTailFullConnected(
  answer: HeadToTailFullAnswer,
  state: HeadToTailFullState,
): boolean {
  return equalsWithTolerance(state.bTail, answer.vectorA, answer.tolerance)
}

export function isHeadToTailFullSumDrawn(
  answer: HeadToTailFullAnswer,
  state: HeadToTailFullState,
): boolean {
  return equalsWithTolerance(state.sumTip, add(answer.vectorA, answer.vectorB), answer.tolerance)
}

export function validateHeadToTailFull(
  answer: HeadToTailFullAnswer,
  state: HeadToTailFullState,
): boolean {
  const target = add(answer.vectorA, answer.vectorB)
  const connected = equalsWithTolerance(state.bTail, answer.vectorA, answer.tolerance)
  const drawnCorrect = equalsWithTolerance(state.sumTip, target, answer.tolerance)
  const inputCorrect = equalsWithTolerance(state.sumInput, target, answer.tolerance)
  return connected && drawnCorrect && inputCorrect
}

export function validateHeadToTailFree(
  answer: HeadToTailFreeAnswer,
  state: HeadToTailFreeState,
): boolean {
  // Only the typed a + b is graded; the draggable vectors are exploration aids.
  return equalsWithTolerance(state.sumInput, add(answer.vectorA, answer.vectorB), answer.tolerance)
}

/** Whether the arrow has been dragged across the origin to point at −B. */
export function isNegateReversed(
  answer: NegateVectorAnswer,
  state: NegateVectorState,
): boolean {
  return equalsWithTolerance(state.tip, scale(answer.baseVector, -1), answer.tolerance)
}

export function validateNegateVector(
  answer: NegateVectorAnswer,
  state: NegateVectorState,
): boolean {
  const target = scale(answer.baseVector, -1)
  const reversed = equalsWithTolerance(state.tip, target, answer.tolerance)
  const inputCorrect = equalsWithTolerance(state.vectorInput, target, answer.tolerance)
  return reversed && inputCorrect
}

/** The result of the difference: A − B = A + (−B). */
export function subtractTarget(answer: VectorSubtractAnswer): Vec2 {
  return add(answer.vectorA, scale(answer.vectorB, -1))
}

/** Whether the −B arrow has been reversed (its displacement now points opposite to B). */
export function isVectorReversed(
  answer: VectorSubtractAnswer,
  state: VectorSubtractState,
): boolean {
  return equalsWithTolerance(state.negDisp, scale(answer.vectorB, -1), answer.tolerance)
}

export function validateVectorSubtract(
  question: { gated: boolean; correctAnswer: VectorSubtractAnswer },
  state: VectorSubtractState,
): boolean {
  const answer = question.correctAnswer
  const inputCorrect = equalsWithTolerance(
    state.sumInput,
    subtractTarget(answer),
    answer.tolerance,
  )

  // Q2 gates on reversing B first; Q3–Q5 grade only the typed difference.
  if (question.gated) {
    return isVectorReversed(answer, state) && inputCorrect
  }

  return inputCorrect
}

function isEntered(vec: readonly [number, number]): boolean {
  return vec[0] !== 0 || vec[1] !== 0
}

/**
 * Whether the learner has done enough for their answer to be graded. For the multi-step
 * Lesson 2 questions this requires completing each step (aligning, drawing) and filling in
 * the bottom a + b blanks, so the Submit button stays greyed out until then.
 */
export function isReadyToSubmit(
  question: Question,
  state: QuestionInteractionState,
): boolean {
  if (question.type === 'headToTailConnect' && state.type === 'headToTailConnect') {
    return isHeadToTailConnected(question.correctAnswer, state) && isEntered(state.endInput)
  }

  if (question.type === 'headToTailDrawSum' && state.type === 'headToTailDrawSum') {
    return isHeadToTailSumDrawn(question.correctAnswer, state) && isEntered(state.sumInput)
  }

  if (question.type === 'headToTailFull' && state.type === 'headToTailFull') {
    return (
      isHeadToTailFullConnected(question.correctAnswer, state) &&
      isHeadToTailFullSumDrawn(question.correctAnswer, state) &&
      isEntered(state.sumInput)
    )
  }

  if (question.type === 'headToTailFree' && state.type === 'headToTailFree') {
    return isEntered(state.sumInput)
  }

  if (question.type === 'scalarSlider' && state.type === 'scalarSlider') {
    if (!isScalarSliderCorrect(question.correctAnswer, state)) {
      return false
    }
    return question.mode === 'findScalar'
      ? state.scalarInput !== 0
      : isEntered(state.vectorInput)
  }

  if (question.type === 'multipleChoice' && state.type === 'multipleChoice') {
    return state.selected.length > 0
  }

  if (question.type === 'negateVector' && state.type === 'negateVector') {
    return isNegateReversed(question.correctAnswer, state) && isEntered(state.vectorInput)
  }

  if (question.type === 'vectorSubtract' && state.type === 'vectorSubtract') {
    if (question.gated && !isVectorReversed(question.correctAnswer, state)) {
      return false
    }
    return isEntered(state.sumInput)
  }

  return true
}

/**
 * Message shown beneath a greyed-out Submit button telling the learner which step is left.
 */
export function getIncompleteStepMessage(
  question: Question,
  state: QuestionInteractionState,
): string {
  if (question.type === 'headToTailConnect' && state.type === 'headToTailConnect') {
    if (!isHeadToTailConnected(question.correctAnswer, state)) {
      return 'Drag the tail of b to the head of a, then fill in the a + b blanks before submitting.'
    }
    return 'Fill in the a + b blanks below before submitting.'
  }

  if (question.type === 'headToTailDrawSum' && state.type === 'headToTailDrawSum') {
    if (!isHeadToTailSumDrawn(question.correctAnswer, state)) {
      return 'Draw the a + b vector to the end of the path, then fill in the a + b blanks before submitting.'
    }
    return 'Fill in the a + b blanks below before submitting.'
  }

  if (question.type === 'headToTailFull' && state.type === 'headToTailFull') {
    if (!isHeadToTailFullConnected(question.correctAnswer, state)) {
      return 'First drag the tail of b to the head of a.'
    }
    if (!isHeadToTailFullSumDrawn(question.correctAnswer, state)) {
      return 'Now draw a + b from the origin to the end of the path.'
    }
    return 'Fill in the a + b blanks below before submitting.'
  }

  if (question.type === 'headToTailFree' && state.type === 'headToTailFree') {
    return 'Fill in the a + b blanks below before submitting.'
  }

  if (question.type === 'scalarSlider' && state.type === 'scalarSlider') {
    if (!isScalarSliderCorrect(question.correctAnswer, state)) {
      return question.mode === 'findScalar'
        ? 'Drag the head of the vector until c · A lines up with the target vector.'
        : 'Drag the head of the vector to build the scaled vector first.'
    }
    return question.mode === 'findScalar'
      ? 'Now type the scalar c below before submitting.'
      : 'Now type the components of the scaled vector below before submitting.'
  }

  if (question.type === 'multipleChoice' && state.type === 'multipleChoice') {
    return 'Select at least one option before submitting.'
  }

  if (question.type === 'negateVector' && state.type === 'negateVector') {
    if (!isNegateReversed(question.correctAnswer, state)) {
      return 'Drag the arrow through the origin so it points the opposite way (−B).'
    }
    return 'Now type the components of −B below before submitting.'
  }

  if (question.type === 'vectorSubtract' && state.type === 'vectorSubtract') {
    if (question.gated && !isVectorReversed(question.correctAnswer, state)) {
      return 'First reverse B: drag its tip through the origin to make −B.'
    }
    return 'Fill in the A − B blanks below before submitting.'
  }

  return 'Complete each step before submitting.'
}

/**
 * Specific "not quite" copy for the head-to-tail addition questions, describing whether the
 * graph placement or the typed values are off.
 */
export function getVectorAdditionIncorrectMessage(
  question: Question,
  state: QuestionInteractionState,
  locked: boolean,
): string | undefined {
  let graphCorrect: boolean
  let inputCorrect: boolean

  if (question.type === 'headToTailConnect' && state.type === 'headToTailConnect') {
    const target = add(question.correctAnswer.vectorA, question.correctAnswer.vectorB)
    graphCorrect = isHeadToTailConnected(question.correctAnswer, state)
    inputCorrect = equalsWithTolerance(state.endInput, target, question.correctAnswer.tolerance)
  } else if (question.type === 'headToTailDrawSum' && state.type === 'headToTailDrawSum') {
    const target = add(question.correctAnswer.vectorA, question.correctAnswer.vectorB)
    graphCorrect = isHeadToTailSumDrawn(question.correctAnswer, state)
    inputCorrect = equalsWithTolerance(state.sumInput, target, question.correctAnswer.tolerance)
  } else if (question.type === 'headToTailFull' && state.type === 'headToTailFull') {
    const target = add(question.correctAnswer.vectorA, question.correctAnswer.vectorB)
    graphCorrect =
      isHeadToTailFullConnected(question.correctAnswer, state) &&
      isHeadToTailFullSumDrawn(question.correctAnswer, state)
    inputCorrect = equalsWithTolerance(state.sumInput, target, question.correctAnswer.tolerance)
  } else if (question.type === 'headToTailFree' && state.type === 'headToTailFree') {
    // No guardrails: only the typed a + b is graded.
    const target = add(question.correctAnswer.vectorA, question.correctAnswer.vectorB)
    graphCorrect = true
    inputCorrect = equalsWithTolerance(state.sumInput, target, question.correctAnswer.tolerance)
  } else {
    return undefined
  }

  if (graphCorrect && inputCorrect) {
    return undefined
  }

  const tail = locked
    ? 'Review the explanation below, then continue.'
    : 'Adjust it and try again, or read the hint.'

  if (!graphCorrect && !inputCorrect) {
    return `Not quite. The vectors on the graph and the a + b values you typed are both off. ${tail}`
  }

  if (!graphCorrect) {
    return `Not quite. The vectors on the graph aren't placed correctly. ${tail}`
  }

  return `Not quite. The a + b values you typed don't match the path. ${tail}`
}

export function getScalarIncorrectMessage(
  question: Question,
  state: QuestionInteractionState,
  locked: boolean,
): string | undefined {
  if (question.type !== 'scalarSlider' || state.type !== 'scalarSlider') {
    return undefined
  }

  if (validateScalarMultiply(question, state)) {
    return undefined
  }

  const tail = locked
    ? 'Review the explanation below, then continue.'
    : 'Adjust it and try again, or read the hint.'

  if (!isScalarSliderCorrect(question.correctAnswer, state)) {
    return question.mode === 'findScalar'
      ? `Not quite. c · A doesn't match the target vector yet. ${tail}`
      : `Not quite. The vector isn't at the right scale yet. ${tail}`
  }

  return question.mode === 'findScalar'
    ? `Not quite. The scalar c you typed is off. ${tail}`
    : `Not quite. The scaled vector you typed is off. ${tail}`
}

export function getMultipleChoiceIncorrectMessage(
  question: Question,
  state: QuestionInteractionState,
  locked: boolean,
): string | undefined {
  if (question.type !== 'multipleChoice' || state.type !== 'multipleChoice') {
    return undefined
  }

  if (validateMultipleChoice(question.correctAnswer, state)) {
    return undefined
  }

  const tail = locked
    ? 'Review the explanation below, then continue.'
    : 'Adjust your selection and try again, or read the hint.'

  const correct = new Set(question.correctAnswer.correctOptionIds)
  const hasWrong = state.selected.some((id) => !correct.has(id))

  if (hasWrong) {
    return `Not quite. At least one of your choices is not a multiple of A. ${tail}`
  }

  return `Not quite. There's at least one more multiple of A to find. ${tail}`
}

export function getNegateIncorrectMessage(
  question: Question,
  state: QuestionInteractionState,
  locked: boolean,
): string | undefined {
  if (question.type !== 'negateVector' || state.type !== 'negateVector') {
    return undefined
  }

  if (validateNegateVector(question.correctAnswer, state)) {
    return undefined
  }

  const tail = locked
    ? 'Review the explanation below, then continue.'
    : 'Adjust it and try again, or read the hint.'

  if (!isNegateReversed(question.correctAnswer, state)) {
    return `Not quite. The arrow isn't pointing at −B yet — reverse its direction across the origin. ${tail}`
  }

  return `Not quite. The components you typed for −B are off. ${tail}`
}

export function getSubtractIncorrectMessage(
  question: Question,
  state: QuestionInteractionState,
  locked: boolean,
): string | undefined {
  if (question.type !== 'vectorSubtract' || state.type !== 'vectorSubtract') {
    return undefined
  }

  if (validateVectorSubtract(question, state)) {
    return undefined
  }

  const tail = locked
    ? 'Review the explanation below, then continue.'
    : 'Adjust it and try again, or read the hint.'

  if (question.gated && !isVectorReversed(question.correctAnswer, state)) {
    return `Not quite. Reverse B first by dragging its tip through the origin to make −B. ${tail}`
  }

  return `Not quite. The A − B values you typed don't match. ${tail}`
}

export function validateQuestion(
  question: Question,
  state: QuestionInteractionState,
): boolean {
  if (question.type === 'drawVector' && state.type === 'drawVector') {
    return validateDrawVector(question.correctAnswer, state)
  }

  if (question.type === 'headToTailAdd' && state.type === 'headToTailAdd') {
    return validateHeadToTailAdd(question.correctAnswer, state)
  }

  if (question.type === 'scalarSlider' && state.type === 'scalarSlider') {
    return validateScalarMultiply(question, state)
  }

  if (question.type === 'multipleChoice' && state.type === 'multipleChoice') {
    return validateMultipleChoice(question.correctAnswer, state)
  }

  if (question.type === 'headToTailConnect' && state.type === 'headToTailConnect') {
    return validateHeadToTailConnect(question.correctAnswer, state)
  }

  if (question.type === 'headToTailDrawSum' && state.type === 'headToTailDrawSum') {
    return validateHeadToTailDrawSum(question.correctAnswer, state)
  }

  if (question.type === 'headToTailFull' && state.type === 'headToTailFull') {
    return validateHeadToTailFull(question.correctAnswer, state)
  }

  if (question.type === 'headToTailFree' && state.type === 'headToTailFree') {
    return validateHeadToTailFree(question.correctAnswer, state)
  }

  if (question.type === 'negateVector' && state.type === 'negateVector') {
    return validateNegateVector(question.correctAnswer, state)
  }

  if (question.type === 'vectorSubtract' && state.type === 'vectorSubtract') {
    return validateVectorSubtract(question, state)
  }

  return false
}
