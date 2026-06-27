import type { Question, QuestionInteractionState } from '../types/lesson'
import { add, equalsWithTolerance, scale, type Vec2 } from './vectorMath'

/**
 * Turns the current question (and the learner's live interaction state) into plain-language guidance
 * for the AI tutor:
 *
 * - `describeSolutionSteps` — the canonical procedure for this question type. This stops the tutor
 *   from inventing steps that don't apply (e.g. telling the learner to "draw the vectors" when the
 *   vectors are fixed and only the resultant must be drawn).
 * - `describeCurrentProgress` — what the learner has already done and what the single next action is,
 *   so the tutor nudges the *right* step (e.g. "move B head-to-tail first" vs. "now draw A + B").
 *
 * Both return short strings meant to be handed to the model as context, never shown to the learner.
 */

function tolFor(question: Question): number {
  const raw = (question.correctAnswer as { tolerance?: number }).tolerance
  // Be a little more lenient than grading when judging "has this step been done", so near-complete
  // drags still count as done for the purpose of nudging the next step.
  return Math.max(typeof raw === 'number' ? raw : 0.4, 0.4)
}

function neg(v: Vec2): Vec2 {
  return scale(v, -1)
}

export function describeSolutionSteps(question: Question): string {
  switch (question.type) {
    case 'drawVector':
      return 'Drag the arrow\u2019s tip so it points to the target (its tail stays at the origin). The two components tell you how far to go right/left and up/down.'
    case 'readVector':
      return 'Read the arrow already drawn on the grid: count how far it travels horizontally (x) and vertically (y), then type those two components.'
    case 'findMagnitude':
      return 'The magnitude IS the length of the arrow \u2014 lead with that idea first. Then guide them to use the Pythagorean theorem to find that length. ONLY if they are still confused, explain what the Pythagorean theorem says: the x and y components form the two legs of a right triangle and the vector is the hypotenuse, so length = \u221a(x\u00b2 + y\u00b2). Never compute or state the final number for them.'
    case 'headToTailAdd':
    case 'headToTailDrawSum':
      return 'Vectors A and B are already placed head-to-tail for you \u2014 you do NOT need to redraw them. The step is to draw the resultant A + B from the tail of A to the head of B, then read off / type its components.'
    case 'headToTailConnect':
      return 'Vectors A and B are given. Move vector B so its tail sits exactly on the head of A (connect them head-to-tail). Then the endpoint of B is A + B \u2014 read off and type those coordinates. You do not redraw A or B.'
    case 'headToTailFull':
      return 'Three steps: (1) move vector B so its tail sits on the head of A (connect head-to-tail); (2) draw the resultant A + B from the tail of A to the head of B; (3) type the components of A + B. You never redraw A or B \u2014 only move B and draw the resultant.'
    case 'headToTailFree':
      return 'You only need to compute A + B by adding the components (\u27e8ax+bx, ay+by\u27e9) and type it. Arranging the vectors head-to-tail on the grid is optional and just there to help you picture it.'
    case 'negateVector':
      return 'Point the arrow in the exact opposite direction of B while keeping the same length \u2014 that lands on \u2212B (negate both components). Then type \u2212B\u2019s components.'
    case 'vectorSubtract':
      return question.gated
        ? 'A \u2212 B = A + (\u2212B). Steps: (1) reverse B to get \u2212B (same length, opposite direction); (2) move \u2212B so its tail sits on the head of A; (3) draw the resultant from the tail of A to the head of \u2212B; (4) type the components of A \u2212 B. You do not redraw A.'
        : 'Subtract componentwise: A \u2212 B = \u27e8ax\u2212bx, ay\u2212by\u27e9, and type the result. The grid is there to help but you don\u2019t have to move anything.'
    case 'scalarSlider':
      return question.mode === 'findScalar'
        ? 'Drag the slider until the scaled copy of the vector lands exactly on the target, then type the scalar c that produced it.'
        : 'Drag the slider to the given scalar c (this stretches or flips the vector), then type the components of the scaled vector c\u00b7A.'
    case 'multipleChoice':
      return 'Check each option against the definition in the prompt and select the one(s) that satisfy it.'
    case 'linearCombo':
      return question.mode === 'reachable'
        ? 'Decide whether ANY combination of the base vectors can reach the highlighted target, then answer yes or no.'
        : 'Adjust the coefficient(s) (the sliders or by dragging) so the combination lands exactly on the highlighted target point.'
    case 'constructCombo':
      if (question.mode === 'recognize') {
        return 'Decide whether the target point is some combination c\u00b7A + d\u00b7B, then answer yes or no.'
      }
      if (question.mode === 'findScalars') {
        return 'Adjust the scales on A and B until the combination lands on the target, then type the scalars c and d.'
      }
      return 'Scale A by its coefficient, scale B by its coefficient, connect the scaled vectors head-to-tail, draw the result, then type the resulting point.'
    default:
      return 'Work through the prompt one step at a time.'
  }
}

export function describeCurrentProgress(
  question: Question,
  state: QuestionInteractionState,
): string | undefined {
  if (state.type !== question.type) {
    return undefined
  }
  const tol = tolFor(question)

  switch (question.type) {
    case 'headToTailConnect': {
      if (state.type !== 'headToTailConnect') {
        return undefined
      }
      const connected = equalsWithTolerance(state.bTail, state.vectorA, tol)
      return connected
        ? 'B is now connected head-to-tail to A. The next step is to type the coordinates where the path ends (the head of B), which equals A + B.'
        : 'Vector B has NOT been moved into place yet \u2014 the immediate next step is to drag B so its tail sits on the head of A.'
    }
    case 'headToTailDrawSum':
    case 'headToTailAdd': {
      if (state.type !== 'headToTailDrawSum' && state.type !== 'headToTailAdd') {
        return undefined
      }
      const target = add(state.vectorA, state.vectorB)
      const sumDrawn = equalsWithTolerance(state.sumTip, target, tol)
      return sumDrawn
        ? 'The resultant A + B is drawn correctly. The next step is to type its components.'
        : 'The resultant has NOT been drawn yet \u2014 the immediate next step is to draw A + B from the tail of A to the head of B.'
    }
    case 'headToTailFull': {
      if (state.type !== 'headToTailFull') {
        return undefined
      }
      const connected = equalsWithTolerance(state.bTail, state.vectorA, tol)
      if (!connected) {
        return 'Vector B has NOT been moved yet \u2014 the immediate next step is to move B so its tail sits on the head of A.'
      }
      const sumDrawn = equalsWithTolerance(state.sumTip, add(state.vectorA, state.vectorB), tol)
      return sumDrawn
        ? 'B is connected and the resultant is drawn. The next step is to type the components of A + B.'
        : 'B is connected head-to-tail. The immediate next step is to draw the resultant A + B from the tail of A to the head of B (B itself is already in place \u2014 don\u2019t move it again).'
    }
    case 'negateVector': {
      if (state.type !== 'negateVector') {
        return undefined
      }
      const pointed = equalsWithTolerance(state.tip, neg(state.baseVector), tol)
      return pointed
        ? 'The arrow now points to \u2212B. The next step is to type \u2212B\u2019s components.'
        : 'The arrow does NOT point to \u2212B yet \u2014 the next step is to reverse it: same length, exact opposite direction.'
    }
    case 'vectorSubtract': {
      if (state.type !== 'vectorSubtract' || !question.gated) {
        return undefined
      }
      const reversed = equalsWithTolerance(state.negDisp, neg(state.vectorB), tol)
      if (!reversed) {
        return 'B has NOT been reversed yet \u2014 the first step is to flip B into \u2212B (same length, opposite direction).'
      }
      const connected = equalsWithTolerance(state.negTail, state.vectorA, tol)
      if (!connected) {
        return '\u2212B is reversed but not yet moved \u2014 the next step is to move \u2212B so its tail sits on the head of A.'
      }
      const drawn = equalsWithTolerance(state.sumTip, add(state.vectorA, neg(state.vectorB)), tol)
      return drawn
        ? 'Everything is in place and A \u2212 B is drawn. The next step is to type the components of A \u2212 B.'
        : 'B is reversed and connected. The next step is to draw the resultant from the tail of A to the head of \u2212B \u2014 that is A \u2212 B.'
    }
    default:
      return undefined
  }
}
