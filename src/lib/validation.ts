import type {
  DrawVectorAnswer,
  DrawVectorState,
  FindMagnitudeAnswer,
  FindMagnitudeState,
  ReadVectorAnswer,
  ReadVectorState,
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
  LinearComboAnswer,
  LinearComboState,
  ConstructComboAnswer,
  ConstructComboQuestion,
  ConstructComboState,
} from '../types/lesson'
import { add, equalsWithTolerance, magnitude, scale, type Vec2 } from './vectorMath'

/** The base vectors of a linear-combination question as an array (one or two). */
export function comboVectors(answer: LinearComboAnswer): Vec2[] {
  return answer.vectorB ? [answer.vectorA, answer.vectorB] : [answer.vectorA]
}

/** The full ordered list of targets a 'reach' question cycles through (one or more). */
export function comboTargets(answer: LinearComboAnswer): Vec2[] {
  const targets: Vec2[] = [answer.target]
  if (answer.target2) {
    targets.push(answer.target2)
  }
  if (answer.target3) {
    targets.push(answer.target3)
  }
  return targets
}

/** Evaluate c·A (+ d·B …) for the given coefficients and base vectors. */
export function linearCombination(vectors: Vec2[], coefficients: number[]): Vec2 {
  return vectors.reduce<Vec2>(
    (acc, vector, index) => add(acc, scale(vector, coefficients[index] ?? 0)),
    [0, 0],
  )
}

/** The currently active target index, clamped to the available targets. */
export function comboTargetIndex(answer: LinearComboAnswer, state: LinearComboState): number {
  const last = comboTargets(answer).length - 1
  return Math.min(Math.max(state.targetIndex ?? 0, 0), last)
}

/** True when the current coefficients land the combined point on the currently active target. */
export function isLinearComboOnTarget(
  answer: LinearComboAnswer,
  state: LinearComboState,
): boolean {
  const targets = comboTargets(answer)
  const current = targets[comboTargetIndex(answer, state)]
  return equalsWithTolerance(
    linearCombination(comboVectors(answer), state.coefficients),
    current,
    answer.tolerance,
  )
}

/** A 'reach' question is solved once the learner lands on the final target in the sequence. */
export function isLinearComboReachSolved(
  answer: LinearComboAnswer,
  state: LinearComboState,
): boolean {
  const last = comboTargets(answer).length - 1
  return comboTargetIndex(answer, state) === last && isLinearComboOnTarget(answer, state)
}

export function validateLinearCombo(
  question: { mode: 'reach' | 'reachable'; correctAnswer: LinearComboAnswer },
  state: LinearComboState,
): boolean {
  if (question.mode === 'reachable') {
    return state.reachableInput === (question.correctAnswer.reachable ? 'yes' : 'no')
  }
  return isLinearComboReachSolved(question.correctAnswer, state)
}

// --- Construct combination (cA + dB built head-to-tail) ---

/** The endpoint of the constructed combination: coefA·A + coefB·B. */
export function constructTarget(answer: ConstructComboAnswer): Vec2 {
  return add(scale(answer.vectorA, answer.coefA), scale(answer.vectorB, answer.coefB))
}

/** True when A has been scaled to the prescribed coefficient. */
export function isConstructScaledA(answer: ConstructComboAnswer, state: ConstructComboState): boolean {
  return Math.abs(state.aScale - answer.coefA) <= answer.tolerance
}

/** True when B has been scaled to the prescribed coefficient. */
export function isConstructScaledB(answer: ConstructComboAnswer, state: ConstructComboState): boolean {
  return Math.abs(state.bScale - answer.coefB) <= answer.tolerance
}

/** True when the scaled B's tail sits on the head of the scaled A (head-to-tail). */
export function isConstructConnected(
  answer: ConstructComboAnswer,
  state: ConstructComboState,
): boolean {
  return equalsWithTolerance(state.bTail, scale(answer.vectorA, answer.coefA), answer.tolerance)
}

/** True when the result vector is drawn from the origin to coefA·A + coefB·B. */
export function isConstructDrawn(answer: ConstructComboAnswer, state: ConstructComboState): boolean {
  return equalsWithTolerance(state.resultTip, constructTarget(answer), answer.tolerance)
}

/** True when the typed coordinates match the target. */
export function isConstructInputCorrect(
  answer: ConstructComboAnswer,
  state: ConstructComboState,
): boolean {
  return equalsWithTolerance(state.resultInput, answer.target, answer.tolerance)
}

/** True when the typed scalars c and d match the prescribed coefficients (findScalars mode). */
export function isConstructScalarsCorrect(
  answer: ConstructComboAnswer,
  state: ConstructComboState,
): boolean {
  return (
    Math.abs(state.coefAInput - answer.coefA) <= answer.tolerance &&
    Math.abs(state.coefBInput - answer.coefB) <= answer.tolerance
  )
}

export function validateConstructCombo(
  question: ConstructComboQuestion,
  state: ConstructComboState,
): boolean {
  const answer = question.correctAnswer

  if (question.mode === 'recognize') {
    return state.reachableInput === (answer.reachable ? 'yes' : 'no')
  }

  if (question.mode === 'findScalars') {
    return isConstructScalarsCorrect(answer, state)
  }

  if (question.gated) {
    return (
      isConstructScaledA(answer, state) &&
      isConstructScaledB(answer, state) &&
      isConstructConnected(answer, state) &&
      isConstructDrawn(answer, state) &&
      isConstructInputCorrect(answer, state)
    )
  }

  // Independent: only the typed answer is graded (the construction is an optional scaffold).
  return isConstructInputCorrect(answer, state)
}

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

export function validateReadVector(answer: ReadVectorAnswer, state: ReadVectorState): boolean {
  return equalsWithTolerance(state.vectorInput, answer.vector, answer.tolerance)
}

export function validateFindMagnitude(
  answer: FindMagnitudeAnswer,
  state: FindMagnitudeState,
): boolean {
  return Math.abs(state.magnitudeInput - answer.magnitude) <= answer.tolerance
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

/** Whether −B has been connected head-to-tail to A (its tail sits at A's head). */
export function isSubtractConnected(
  answer: VectorSubtractAnswer,
  state: VectorSubtractState,
): boolean {
  return equalsWithTolerance(state.negTail, answer.vectorA, answer.tolerance)
}

/** Whether the A − B result vector has been drawn from the origin to A + (−B). */
export function isSubtractSumDrawn(
  answer: VectorSubtractAnswer,
  state: VectorSubtractState,
): boolean {
  return equalsWithTolerance(state.sumTip, subtractTarget(answer), answer.tolerance)
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

  // Guided questions (Q1–Q2) walk the full workflow: reverse B, connect head-to-tail, draw the
  // result, then type it. Freeform questions (Q3–Q5) only grade the typed difference — the graph
  // is a scaffold, so reversing/connecting/drawing are optional there.
  if (question.gated) {
    return (
      isVectorReversed(answer, state) &&
      isSubtractConnected(answer, state) &&
      isSubtractSumDrawn(answer, state) &&
      inputCorrect
    )
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
  if (question.type === 'readVector' && state.type === 'readVector') {
    return isEntered(state.vectorInput)
  }

  if (question.type === 'findMagnitude' && state.type === 'findMagnitude') {
    return state.magnitudeInput > 0
  }

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
    // Guided questions gate the typed answer on landing the drag first; ungated ones only need
    // an entered answer (correctness still checks the graph on submit).
    if (question.gated !== false && !isScalarSliderCorrect(question.correctAnswer, state)) {
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
    if (question.gated) {
      // Guided: every step must be complete before submitting.
      return (
        isVectorReversed(question.correctAnswer, state) &&
        isSubtractConnected(question.correctAnswer, state) &&
        isSubtractSumDrawn(question.correctAnswer, state) &&
        isEntered(state.sumInput)
      )
    }
    // Freeform: only the typed answer is required.
    return isEntered(state.sumInput)
  }

  if (question.type === 'linearCombo' && state.type === 'linearCombo') {
    if (question.mode === 'reachable') {
      return state.reachableInput !== null
    }
    // 'reach': the learner must land on the final target before submitting.
    return isLinearComboReachSolved(question.correctAnswer, state)
  }

  if (question.type === 'constructCombo' && state.type === 'constructCombo') {
    if (question.mode === 'recognize') {
      return state.reachableInput !== null
    }
    if (question.mode === 'findScalars') {
      // Only an entered pair of scalars is required (correctness is checked on submit).
      return state.coefAInput !== 0 && state.coefBInput !== 0
    }
    const answer = question.correctAnswer
    if (question.gated) {
      // Guided: every construction step must be complete before submitting.
      return (
        isConstructScaledA(answer, state) &&
        isConstructScaledB(answer, state) &&
        isConstructConnected(answer, state) &&
        isConstructDrawn(answer, state) &&
        isEntered(state.resultInput)
      )
    }
    // Independent: only the typed answer is required.
    return isEntered(state.resultInput)
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
  if (question.type === 'readVector' && state.type === 'readVector') {
    return 'Type the components of the vector shown before submitting.'
  }

  if (question.type === 'findMagnitude' && state.type === 'findMagnitude') {
    return 'Type the magnitude before submitting.'
  }

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
    if (question.gated !== false && !isScalarSliderCorrect(question.correctAnswer, state)) {
      return question.mode === 'findScalar'
        ? 'Drag the head of the vector until c · A lines up with the target vector.'
        : 'Drag the head of the vector to build the scaled vector first.'
    }
    return question.mode === 'findScalar'
      ? 'Type the scalar c below before submitting.'
      : 'Type the components of the scaled vector below before submitting.'
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
    if (question.gated) {
      if (!isVectorReversed(question.correctAnswer, state)) {
        return 'First click "Reverse B" to flip B into −B.'
      }
      if (!isSubtractConnected(question.correctAnswer, state)) {
        return 'Connect −B head-to-tail: drag its tail to the head of A.'
      }
      if (!isSubtractSumDrawn(question.correctAnswer, state)) {
        return 'Now draw A − B from the origin to the end of the path.'
      }
    }
    return 'Fill in the A − B blanks below before submitting.'
  }

  if (question.type === 'linearCombo' && state.type === 'linearCombo') {
    if (question.mode === 'reachable') {
      return 'Explore with the sliders, then choose whether the target can be reached.'
    }
    return 'Adjust the sliders until the endpoint lands exactly on the target point.'
  }

  if (question.type === 'constructCombo' && state.type === 'constructCombo') {
    if (question.mode === 'recognize') {
      return 'Explore the construction, then answer Yes or No.'
    }
    if (question.mode === 'findScalars') {
      return 'Scale and connect A and B to reach the point, then enter both scalars c and d.'
    }
    const answer = question.correctAnswer
    if (question.gated) {
      if (!isConstructScaledA(answer, state)) {
        return 'First scale A: drag its head until A is the right multiple.'
      }
      if (!isConstructConnected(answer, state)) {
        return 'Now connect head-to-tail: drag B’s tail to the head of the scaled A.'
      }
      if (!isConstructScaledB(answer, state)) {
        return 'Now scale B: drag its head until B is the right multiple.'
      }
      if (!isConstructDrawn(answer, state)) {
        return 'Now draw the result from the origin to the end of the path.'
      }
    }
    return 'Type the resulting coordinates below before submitting.'
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

export function getReadVectorIncorrectMessage(
  question: Question,
  state: QuestionInteractionState,
  locked: boolean,
): string | undefined {
  if (question.type !== 'readVector' || state.type !== 'readVector') {
    return undefined
  }

  if (validateReadVector(question.correctAnswer, state)) {
    return undefined
  }

  const tail = locked
    ? 'Review the explanation below, then continue.'
    : 'Re-read the vector from the graph and try again, or check the hint.'

  return `Not quite. Those aren't the components of the vector shown. ${tail}`
}

export function getFindMagnitudeIncorrectMessage(
  question: Question,
  state: QuestionInteractionState,
  locked: boolean,
): string | undefined {
  if (question.type !== 'findMagnitude' || state.type !== 'findMagnitude') {
    return undefined
  }

  if (validateFindMagnitude(question.correctAnswer, state)) {
    return undefined
  }

  const tail = locked
    ? 'Review the explanation below, then continue.'
    : 'Use the right triangle to find the length and try again, or check the hint.'

  return `Not quite. That isn't the magnitude of the vector. ${tail}`
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

  const answer = question.correctAnswer
  const graphWrong = !isScalarSliderCorrect(answer, state)
  const target = scale(answer.baseVector, answer.scalar)
  const answerWrong =
    question.mode === 'findScalar'
      ? Math.abs(state.scalarInput - answer.scalar) > answer.tolerance
      : !equalsWithTolerance(state.vectorInput, target, SCALAR_VECTOR_TOLERANCE)

  if (graphWrong && answerWrong) {
    return `Not quite. Both the vector on the graph and your typed answer are off. ${tail}`
  }

  if (graphWrong) {
    return question.mode === 'findScalar'
      ? `Not quite. Your typed scalar is right, but c · A doesn't line up with the target on the graph yet. ${tail}`
      : `Not quite. Your typed answer is right, but the vector on the graph isn't at the right scale yet. ${tail}`
  }

  return question.mode === 'findScalar'
    ? `Not quite. The vector lines up, but the scalar c you typed is off. ${tail}`
    : `Not quite. The vector lines up, but the scaled vector you typed is off. ${tail}`
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

  if (question.gated) {
    if (!isVectorReversed(question.correctAnswer, state)) {
      return `Not quite. Reverse B first with the "Reverse B" button to make −B. ${tail}`
    }
    if (!isSubtractConnected(question.correctAnswer, state)) {
      return `Not quite. Connect −B head-to-tail to A — drag its tail to the head of A. ${tail}`
    }
    if (!isSubtractSumDrawn(question.correctAnswer, state)) {
      return `Not quite. Draw the A − B vector from the origin to the end of the path. ${tail}`
    }
  }

  return `Not quite. The A − B values you typed don't match. ${tail}`
}

export function getLinearComboIncorrectMessage(
  question: Question,
  state: QuestionInteractionState,
  locked: boolean,
): string | undefined {
  if (question.type !== 'linearCombo' || state.type !== 'linearCombo') {
    return undefined
  }

  if (validateLinearCombo(question, state)) {
    return undefined
  }

  const tail = locked
    ? 'Review the explanation below, then continue.'
    : 'Look again and try once more, or read the hint.'

  if (question.mode === 'reachable') {
    return `Not quite. Check whether the target sits on the line your vectors can build. ${tail}`
  }

  return `Not quite. The endpoint isn't on the target yet — keep adjusting the sliders. ${tail}`
}

export function getConstructComboIncorrectMessage(
  question: Question,
  state: QuestionInteractionState,
  locked: boolean,
): string | undefined {
  if (question.type !== 'constructCombo' || state.type !== 'constructCombo') {
    return undefined
  }

  if (validateConstructCombo(question, state)) {
    return undefined
  }

  const tail = locked
    ? 'Review the explanation below, then continue.'
    : 'Adjust it and try again, or read the hint.'

  const answer = question.correctAnswer

  if (question.mode === 'recognize') {
    return answer.reachable
      ? `Not quite. This vector is a linear combination of A and B — some choice of c and d reaches it. ${tail}`
      : `Not quite. No combination of A and B can reach this vector. ${tail}`
  }

  if (question.mode === 'findScalars') {
    const cWrong = Math.abs(state.coefAInput - answer.coefA) > answer.tolerance
    const dWrong = Math.abs(state.coefBInput - answer.coefB) > answer.tolerance
    if (cWrong && dWrong) {
      return `Not quite. Both scalars c and d are off. ${tail}`
    }
    if (cWrong) {
      return `Not quite. Your d is right, but the scalar c is off. ${tail}`
    }
    return `Not quite. Your c is right, but the scalar d is off. ${tail}`
  }

  if (question.gated) {
    const drawnWrong = !isConstructDrawn(answer, state)
    const inputWrong = !isConstructInputCorrect(answer, state)
    if (drawnWrong && inputWrong) {
      return `Not quite. Both the drawn result and the coordinates you typed are off. ${tail}`
    }
    if (drawnWrong) {
      return `Not quite. The drawn result vector is off. ${tail}`
    }
  }

  return `Not quite. The coordinates you typed are off. ${tail}`
}

export function validateQuestion(
  question: Question,
  state: QuestionInteractionState,
): boolean {
  if (question.type === 'drawVector' && state.type === 'drawVector') {
    return validateDrawVector(question.correctAnswer, state)
  }

  if (question.type === 'readVector' && state.type === 'readVector') {
    return validateReadVector(question.correctAnswer, state)
  }

  if (question.type === 'findMagnitude' && state.type === 'findMagnitude') {
    return validateFindMagnitude(question.correctAnswer, state)
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

  if (question.type === 'linearCombo' && state.type === 'linearCombo') {
    return validateLinearCombo(question, state)
  }

  if (question.type === 'constructCombo' && state.type === 'constructCombo') {
    return validateConstructCombo(question, state)
  }

  return false
}
