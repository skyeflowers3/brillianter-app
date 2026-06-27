import { describe, expect, it } from 'vitest'
import { describeCurrentProgress, describeSolutionSteps } from './solutionGuide'
import type {
  HeadToTailFullQuestion,
  HeadToTailFullState,
  HeadToTailDrawSumQuestion,
  HeadToTailDrawSumState,
} from '../types/lesson'

const drawSumQuestion: HeadToTailDrawSumQuestion = {
  id: 'q-drawsum',
  type: 'headToTailDrawSum',
  prompt: 'Draw A + B',
  correctAnswer: { type: 'headToTailDrawSum', vectorA: [2, 0], vectorB: [0, 3], tolerance: 0.4 },
  hint: '',
  explanation: '',
  order: 1,
}

const fullQuestion: HeadToTailFullQuestion = {
  id: 'q-full',
  type: 'headToTailFull',
  prompt: 'Add A and B head to tail',
  correctAnswer: { type: 'headToTailFull', vectorA: [2, 1], vectorB: [1, 3], tolerance: 0.4 },
  hint: '',
  explanation: '',
  order: 1,
}

describe('describeSolutionSteps', () => {
  it('tells the learner NOT to redraw fixed vectors for draw-sum questions', () => {
    const steps = describeSolutionSteps(drawSumQuestion)
    expect(steps).toMatch(/already placed head-to-tail/i)
    expect(steps).toMatch(/resultant A \+ B/i)
  })

  it('lists the move-then-draw-then-type procedure for full head-to-tail', () => {
    const steps = describeSolutionSteps(fullQuestion)
    expect(steps).toMatch(/move vector B/i)
    expect(steps).toMatch(/draw the resultant/i)
  })
})

describe('describeCurrentProgress (head-to-tail full)', () => {
  function state(overrides: Partial<HeadToTailFullState>): HeadToTailFullState {
    return {
      type: 'headToTailFull',
      vectorA: [2, 1],
      vectorB: [1, 3],
      bTail: [0, 0],
      sumTip: [0, 0],
      sumInput: [0, 0],
      ...overrides,
    }
  }

  it('says to move B first when it is not yet connected', () => {
    const note = describeCurrentProgress(fullQuestion, state({ bTail: [0, 0] }))
    expect(note).toMatch(/move B/i)
    expect(note).not.toMatch(/draw the resultant/i)
  })

  it('says to draw the resultant once B is connected but the sum is not drawn', () => {
    // B connected at the head of A = [2, 1].
    const note = describeCurrentProgress(fullQuestion, state({ bTail: [2, 1], sumTip: [0, 0] }))
    expect(note).toMatch(/draw the resultant A \+ B/i)
    expect(note).toMatch(/already in place/i)
  })

  it('says to type the components once everything is drawn', () => {
    const note = describeCurrentProgress(
      fullQuestion,
      state({ bTail: [2, 1], sumTip: [3, 4] }), // A + B = [3, 4]
    )
    expect(note).toMatch(/type the components/i)
  })
})

describe('describeCurrentProgress (draw-sum)', () => {
  function state(sumTip: [number, number]): HeadToTailDrawSumState {
    return {
      type: 'headToTailDrawSum',
      vectorA: [2, 0],
      vectorB: [0, 3],
      sumTip,
      sumInput: [0, 0],
    }
  }

  it('prompts to draw the resultant when it is not drawn', () => {
    expect(describeCurrentProgress(drawSumQuestion, state([0, 0]))).toMatch(/has NOT been drawn/i)
  })

  it('prompts to type components when the resultant is drawn', () => {
    // A + B = [2, 3]
    expect(describeCurrentProgress(drawSumQuestion, state([2, 3]))).toMatch(/type its components/i)
  })
})
