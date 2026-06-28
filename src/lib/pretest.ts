import type { Question, QuestionInteractionState } from '../types/lesson'
import { INITIAL_SCALAR } from './scalarMultiply'
import { add, distance, scale, type Vec2 } from './vectorMath'

/**
 * Pure logic for the pre-lesson "pretrieval" attempt. None of this scores or judges the
 * learner: it only derives the vectors the reveal needs and a generous closeness check used
 * to pick warm vs. neutral copy. It deliberately does NOT import anything from
 * `validation.ts` (no grading, no incorrect-message helpers).
 *
 * Only the five unguided pretest types are supported: `drawVector`, `headToTailFree`,
 * `vectorSubtract`, `scalarSlider`, and `constructCombo`.
 */

function isNonZero([x, y]: Vec2): boolean {
  return x !== 0 || y !== 0
}

function unsupported(type: string): never {
  throw new Error(`Unsupported pretest question type: ${type}`)
}

/**
 * Whether the graded field(s) hold a committed attempt, used to enable the submit button.
 * Graded fields: drawVector -> tip; headToTailFree/vectorSubtract -> sumInput; scalarSlider
 * -> scalar; constructCombo -> resultInput.
 */
export function hasCommittedAttempt(
  question: Question,
  state: QuestionInteractionState,
): boolean {
  if (question.type === 'drawVector' && state.type === 'drawVector') {
    return isNonZero(state.tip)
  }

  if (question.type === 'headToTailFree' && state.type === 'headToTailFree') {
    return isNonZero(state.sumInput)
  }

  if (question.type === 'vectorSubtract' && state.type === 'vectorSubtract') {
    return isNonZero(state.sumInput)
  }

  if (question.type === 'scalarSlider' && state.type === 'scalarSlider') {
    return state.scalar !== INITIAL_SCALAR
  }

  if (question.type === 'constructCombo' && state.type === 'constructCombo') {
    return isNonZero(state.resultInput)
  }

  return false
}

/** The learner's submitted vector for the graded field. */
export function extractGuessVector(
  question: Question,
  state: QuestionInteractionState,
): Vec2 {
  if (question.type === 'drawVector' && state.type === 'drawVector') {
    return state.tip
  }

  if (question.type === 'headToTailFree' && state.type === 'headToTailFree') {
    return state.sumInput
  }

  if (question.type === 'vectorSubtract' && state.type === 'vectorSubtract') {
    return state.sumInput
  }

  if (question.type === 'scalarSlider' && state.type === 'scalarSlider') {
    return scale(state.baseVector, state.scalar)
  }

  if (question.type === 'constructCombo' && state.type === 'constructCombo') {
    return state.resultInput
  }

  return unsupported(question.type)
}

/** The correct vector the reveal draws and labels. */
export function expectedVector(question: Question): Vec2 {
  if (question.type === 'drawVector') {
    if (!question.correctAnswer.target) {
      throw new Error('drawVector pretest requires a target answer')
    }
    return question.correctAnswer.target
  }

  if (question.type === 'headToTailFree') {
    return add(question.correctAnswer.vectorA, question.correctAnswer.vectorB)
  }

  if (question.type === 'vectorSubtract') {
    const { vectorA, vectorB } = question.correctAnswer
    return [vectorA[0] - vectorB[0], vectorA[1] - vectorB[1]]
  }

  if (question.type === 'scalarSlider') {
    return scale(question.correctAnswer.baseVector, question.correctAnswer.scalar)
  }

  if (question.type === 'constructCombo') {
    const { vectorA, vectorB, coefA, coefB } = question.correctAnswer
    return add(scale(vectorA, coefA), scale(vectorB, coefB))
  }

  return unsupported(question.type)
}

/**
 * Whether the guess lands within the generous `closeThreshold` band (separate from, and
 * more forgiving than, the grading `tolerance`). Drives warm vs. neutral reveal copy only.
 */
export function isCloseGuess(
  question: Question,
  state: QuestionInteractionState,
  closeThreshold: number,
): boolean {
  return distance(extractGuessVector(question, state), expectedVector(question)) <= closeThreshold
}

/** The grading tolerance authored on the question, used only to pick the warm "correct" copy. */
function guessTolerance(question: Question): number {
  if (
    question.type === 'drawVector' ||
    question.type === 'headToTailFree' ||
    question.type === 'vectorSubtract' ||
    question.type === 'scalarSlider' ||
    question.type === 'constructCombo'
  ) {
    return question.correctAnswer.tolerance
  }

  return unsupported(question.type)
}

/**
 * Whether the guess lands within the grading `tolerance`, i.e. it is effectively the right
 * answer. This only chooses affirming "correct" reveal copy; it never scores, gates, or persists.
 */
export function isCorrectGuess(
  question: Question,
  state: QuestionInteractionState,
): boolean {
  return distance(extractGuessVector(question, state), expectedVector(question)) <= guessTolerance(question)
}
