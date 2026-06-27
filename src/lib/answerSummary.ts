import type { AiFeedbackRequest } from '../services/ai/types'
import type { Question, QuestionInteractionState } from '../types/lesson'
import { add, scale, type Vec2 } from './vectorMath'
import { subtractTarget } from './validation'

/**
 * Turns a graded question + the learner's submitted state into the data the AI feedback service
 * needs to diagnose a specific mistake: a short summary of what they entered vs. the correct answer,
 * plus — for coordinate answers — the raw vectors so the model can spot swaps and sign errors.
 *
 * Returns `null` for question types with no single typed answer to compare (multiple choice,
 * reachable/recognize verdicts, magnitude-only draws), where generic feedback is more appropriate.
 */

function fmtNum(value: number): string {
  const rounded = Math.round(value * 100) / 100
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

function fmtVec(vec: Vec2): string {
  return `(${fmtNum(vec[0])}, ${fmtNum(vec[1])})`
}

interface AnswerComparison {
  /** Raw submitted vector, when the answer is a coordinate pair (enables swap/sign diagnosis). */
  submitted?: Vec2
  /** Raw correct vector, when the answer is a coordinate pair. */
  correct?: Vec2
  submittedSummary: string
  correctSummary: string
}

function vectorComparison(submitted: Vec2, correct: Vec2): AnswerComparison {
  return {
    submitted,
    correct,
    submittedSummary: `entered ${fmtVec(submitted)}`,
    correctSummary: fmtVec(correct),
  }
}

/** Compare the learner's typed answer with the correct one, or null when there's nothing to diagnose. */
export function compareAnswer(
  question: Question,
  state: QuestionInteractionState,
): AnswerComparison | null {
  if (question.type === 'drawVector' && state.type === 'drawVector') {
    if (!question.correctAnswer.target) {
      return null
    }
    return vectorComparison(state.tip, question.correctAnswer.target)
  }

  if (question.type === 'readVector' && state.type === 'readVector') {
    return vectorComparison(state.vectorInput, question.correctAnswer.vector)
  }

  if (question.type === 'findMagnitude' && state.type === 'findMagnitude') {
    return {
      submittedSummary: `entered ${fmtNum(state.magnitudeInput)}`,
      correctSummary: fmtNum(question.correctAnswer.magnitude),
    }
  }

  if (question.type === 'headToTailAdd' && state.type === 'headToTailAdd') {
    if (!question.correctAnswer.targetSum) {
      return null
    }
    return vectorComparison(state.sumInput, question.correctAnswer.targetSum)
  }

  if (question.type === 'headToTailConnect' && state.type === 'headToTailConnect') {
    return vectorComparison(
      state.endInput,
      add(question.correctAnswer.vectorA, question.correctAnswer.vectorB),
    )
  }

  if (question.type === 'headToTailDrawSum' && state.type === 'headToTailDrawSum') {
    return vectorComparison(
      state.sumInput,
      add(question.correctAnswer.vectorA, question.correctAnswer.vectorB),
    )
  }

  if (question.type === 'headToTailFull' && state.type === 'headToTailFull') {
    return vectorComparison(
      state.sumInput,
      add(question.correctAnswer.vectorA, question.correctAnswer.vectorB),
    )
  }

  if (question.type === 'headToTailFree' && state.type === 'headToTailFree') {
    return vectorComparison(
      state.sumInput,
      add(question.correctAnswer.vectorA, question.correctAnswer.vectorB),
    )
  }

  if (question.type === 'scalarSlider' && state.type === 'scalarSlider') {
    const answer = question.correctAnswer
    if (question.mode === 'findScalar') {
      return {
        submittedSummary: `entered c = ${fmtNum(state.scalarInput)}`,
        correctSummary: `c = ${fmtNum(answer.scalar)}`,
      }
    }
    return vectorComparison(state.vectorInput, scale(answer.baseVector, answer.scalar))
  }

  if (question.type === 'negateVector' && state.type === 'negateVector') {
    return vectorComparison(state.vectorInput, scale(question.correctAnswer.baseVector, -1))
  }

  if (question.type === 'vectorSubtract' && state.type === 'vectorSubtract') {
    return vectorComparison(state.sumInput, subtractTarget(question.correctAnswer))
  }

  if (question.type === 'constructCombo' && state.type === 'constructCombo') {
    const answer = question.correctAnswer
    if (question.mode === 'construct') {
      return vectorComparison(state.resultInput, answer.target)
    }
    if (question.mode === 'findScalars') {
      return {
        submittedSummary: `entered c = ${fmtNum(state.coefAInput)}, d = ${fmtNum(state.coefBInput)}`,
        correctSummary: `c = ${fmtNum(answer.coefA)}, d = ${fmtNum(answer.coefB)}`,
      }
    }
  }

  // multipleChoice, linearCombo, recognize/reachable verdicts, magnitude-only draws: no typed
  // coordinate answer to diagnose — the static per-type message is clearer.
  return null
}

/**
 * For GUIDED addition/subtraction, the learner finds the result by reading the arrow drawn on the
 * grid — adding/subtracting components hasn't been taught yet. Return an instruction that keeps the
 * feedback about how horizontal/vertical that drawn resultant is. Unguided questions (headToTailFree,
 * ungated vectorSubtract) return undefined so feedback can talk about components.
 */
function guidedResultantFocus(question: Question): string | undefined {
  const guidedAddition =
    question.type === 'headToTailAdd' ||
    question.type === 'headToTailConnect' ||
    question.type === 'headToTailDrawSum' ||
    question.type === 'headToTailFull'
  const guidedSubtraction = question.type === 'vectorSubtract' && question.gated === true

  if (!guidedAddition && !guidedSubtraction) {
    return undefined
  }

  const name = guidedSubtraction ? 'A \u2212 B' : 'A + B'
  return (
    `This is a GUIDED problem: the student finds ${name} by reading the resulting arrow already ` +
    `drawn on the grid. Do NOT mention adding or subtracting x/y components — that idea has not ` +
    `been taught yet. Focus on how far the drawn ${name} arrow goes horizontally (left/right) and ` +
    `vertically (up/down). If they swapped the two numbers, explain they flipped the horizontal and ` +
    `vertical amounts of that vector.`
  )
}

/**
 * Assemble the request for `getMistakeFeedback`, or null when the question has no typed answer to
 * diagnose (the caller should fall back to the static per-type message in that case).
 */
export function buildFeedbackRequest(
  question: Question,
  state: QuestionInteractionState,
  attempts: number,
  usedHint: boolean,
): AiFeedbackRequest | null {
  const comparison = compareAnswer(question, state)
  if (!comparison) {
    return null
  }

  return {
    questionId: question.id,
    questionType: question.type,
    prompt: question.prompt,
    conceptTags: question.conceptTags,
    attempts,
    usedHint,
    submittedSummary: comparison.submittedSummary,
    correctSummary: comparison.correctSummary,
    submitted: comparison.submitted,
    correct: comparison.correct,
    feedbackFocus: guidedResultantFocus(question),
  }
}
