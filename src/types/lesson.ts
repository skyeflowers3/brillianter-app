import type { Vec2 } from '../lib/vectorMath'

export type QuestionType =
  | 'drawVector'
  | 'headToTailAdd'
  | 'headToTailConnect'
  | 'headToTailDrawSum'
  | 'headToTailFull'
  | 'headToTailFree'
  | 'scalarSlider'
  | 'multipleChoice'
  | 'negateVector'
  | 'vectorSubtract'

export type HeadToTailStep = 'drawA' | 'drawB' | 'drawSum'

export type HeadToTailInteractionMode =
  | 'fixedAB_drawSum'
  | 'fixedA_drawB_then_drawSum'
  | 'drawA_drawB_drawSum'

export interface DrawVectorAnswer {
  type: 'drawVector'
  target?: Vec2
  magnitude?: number
  tolerance: number
}

export interface HeadToTailAddAnswer {
  type: 'headToTailAdd'
  vectorA?: Vec2
  vectorB?: Vec2
  targetSum?: Vec2
  tolerance: number
}

export interface ScalarSliderConfig {
  min: number
  max: number
  step: number
}

/**
 * Two interaction modes for scalar questions:
 * - createVector: c is given (e.g. "create 3A"); the learner drags the slider to c, then
 *   types the resulting scaled vector.
 * - findScalar: the target vector is given; the learner drags the slider until c·A matches it,
 *   then types the scalar c.
 */
export type ScalarMode = 'createVector' | 'findScalar'

export interface ScalarMultiplyAnswer {
  type: 'scalarSlider'
  baseVector: Vec2
  scalar: number
  tolerance: number
}

export interface MultipleChoiceOption {
  id: string
  label: string
}

export interface MultipleChoiceAnswer {
  type: 'multipleChoice'
  correctOptionIds: string[]
}

export interface HeadToTailConnectAnswer {
  type: 'headToTailConnect'
  vectorA: Vec2
  vectorB: Vec2
  tolerance: number
}

export interface HeadToTailDrawSumAnswer {
  type: 'headToTailDrawSum'
  vectorA: Vec2
  vectorB: Vec2
  tolerance: number
}

export interface HeadToTailFullAnswer {
  type: 'headToTailFull'
  vectorA: Vec2
  vectorB: Vec2
  tolerance: number
}

export interface HeadToTailFreeAnswer {
  type: 'headToTailFree'
  vectorA: Vec2
  vectorB: Vec2
  tolerance: number
}

export interface NegateVectorAnswer {
  type: 'negateVector'
  /** The vector being reversed; the target answer is −baseVector. */
  baseVector: Vec2
  tolerance: number
}

export interface VectorSubtractAnswer {
  type: 'vectorSubtract'
  vectorA: Vec2
  vectorB: Vec2
  tolerance: number
}

export type QuestionAnswer =
  | DrawVectorAnswer
  | HeadToTailAddAnswer
  | HeadToTailConnectAnswer
  | HeadToTailDrawSumAnswer
  | HeadToTailFullAnswer
  | HeadToTailFreeAnswer
  | ScalarMultiplyAnswer
  | MultipleChoiceAnswer
  | NegateVectorAnswer
  | VectorSubtractAnswer

export interface DrawVectorQuestion {
  id: string
  type: 'drawVector'
  prompt: string
  correctAnswer: DrawVectorAnswer
  hint: string
  explanation: string
  order: number
}

export interface HeadToTailAddQuestion {
  id: string
  type: 'headToTailAdd'
  prompt: string
  interactionMode: HeadToTailInteractionMode
  stepPrompts?: Partial<Record<HeadToTailStep, string>>
  stepHints?: Partial<Record<HeadToTailStep, string>>
  correctAnswer: HeadToTailAddAnswer
  hint: string
  explanation: string
  order: number
}

export interface ScalarMultiplyQuestion {
  id: string
  type: 'scalarSlider'
  mode: ScalarMode
  prompt: string
  /** Optional reference vector shown above the plane (e.g. A = ⟨2, 1⟩). */
  referenceLabel?: string
  slider?: ScalarSliderConfig
  correctAnswer: ScalarMultiplyAnswer
  hint: string
  explanation: string
  order: number
}

/**
 * Optional interactive coordinate plane shown alongside multiple-choice options. The learner can
 * drag a scaled copy of `baseVector` (angle-locked to it) to explore which option points lie on
 * that line, i.e. which are scalar multiples. Purely an exploration aid; it is not graded.
 */
export interface MultipleChoiceExplorer {
  baseVector: Vec2
  min?: number
  max?: number
}

export interface MultipleChoiceQuestion {
  id: string
  type: 'multipleChoice'
  prompt: string
  /** Optional reference vector shown above the options (e.g. A = ⟨3, 2⟩). */
  referenceLabel?: string
  options: MultipleChoiceOption[]
  explorer?: MultipleChoiceExplorer
  correctAnswer: MultipleChoiceAnswer
  hint: string
  explanation: string
  order: number
}

export interface HeadToTailConnectQuestion {
  id: string
  type: 'headToTailConnect'
  prompt: string
  correctAnswer: HeadToTailConnectAnswer
  hint: string
  explanation: string
  order: number
}

export interface HeadToTailDrawSumQuestion {
  id: string
  type: 'headToTailDrawSum'
  prompt: string
  correctAnswer: HeadToTailDrawSumAnswer
  hint: string
  explanation: string
  order: number
}

export interface HeadToTailFullQuestion {
  id: string
  type: 'headToTailFull'
  prompt: string
  correctAnswer: HeadToTailFullAnswer
  hint: string
  explanation: string
  order: number
}

export interface HeadToTailFreeQuestion {
  id: string
  type: 'headToTailFree'
  prompt: string
  correctAnswer: HeadToTailFreeAnswer
  hint: string
  explanation: string
  order: number
}

export interface NegateVectorQuestion {
  id: string
  type: 'negateVector'
  prompt: string
  /** Optional reference vector shown above the plane (e.g. B = ⟨2, 1⟩). */
  referenceLabel?: string
  correctAnswer: NegateVectorAnswer
  hint: string
  explanation: string
  order: number
}

export interface VectorSubtractQuestion {
  id: string
  type: 'vectorSubtract'
  /**
   * When true (e.g. Q2), the learner must reverse B correctly before the rest of the
   * interaction unlocks. When false (Q3–Q5), everything is freeform and only the typed
   * A − B is graded.
   */
  gated: boolean
  /**
   * When true, the label and equation use the A + (−B) form to reinforce that subtraction is
   * just adding the opposite. When false, they use the A − B form.
   */
  additionForm?: boolean
  prompt: string
  /** Optional reference vectors shown above the plane (e.g. A = ⟨3, 1⟩, B = ⟨1, 2⟩). */
  referenceLabel?: string
  correctAnswer: VectorSubtractAnswer
  hint: string
  explanation: string
  order: number
}

export type Question =
  | DrawVectorQuestion
  | HeadToTailAddQuestion
  | HeadToTailConnectQuestion
  | HeadToTailDrawSumQuestion
  | HeadToTailFullQuestion
  | HeadToTailFreeQuestion
  | ScalarMultiplyQuestion
  | MultipleChoiceQuestion
  | NegateVectorQuestion
  | VectorSubtractQuestion

export interface LessonIntro {
  title: string
  paragraphs: string[]
  /** Optional example vector rendered on a coordinate plane. */
  sampleVector?: Vec2
  sampleVectorLabel?: string
  /** Optional head-to-tail addition example (A, B, and A + B). */
  sampleHeadToTail?: {
    vectorA: Vec2
    vectorB: Vec2
  }
  /** Optional subtraction example (A, B, −B, and A − B). */
  sampleSubtraction?: {
    vectorA: Vec2
    vectorB: Vec2
  }
}

export interface LessonInterstitialSegment {
  /** 'math' lines render in a centered monospace style; 'text' lines render as paragraphs. */
  type: 'text' | 'math'
  value: string
}

export interface LessonInterstitial {
  id: string
  /** The interstitial appears after the user finishes the question with this id. */
  afterQuestionId: string
  heading?: string
  segments: LessonInterstitialSegment[]
}

export interface LessonContent {
  lessonId: string
  title: string
  topic: string
  questions: Question[]
  intro?: LessonIntro
  interstitials?: LessonInterstitial[]
}

export interface DrawVectorState {
  type: 'drawVector'
  tip: Vec2
}

export interface HeadToTailAddState {
  type: 'headToTailAdd'
  step: HeadToTailStep
  vectorA: Vec2
  vectorB: Vec2
  /** Position of the drawn a + b vector on the graph */
  sumTip: Vec2
  /** Learner-typed a + b components (independent from sumTip) */
  sumInput: Vec2
}

export interface ScalarMultiplyState {
  type: 'scalarSlider'
  /** The fixed original vector being scaled */
  baseVector: Vec2
  /** Learner-controlled scalar from the slider (phase 1) */
  scalar: number
  /** Typed scaled vector for createVector mode (phase 2) */
  vectorInput: Vec2
  /** Typed scalar c for findScalar mode (phase 2) */
  scalarInput: number
}

export interface MultipleChoiceState {
  type: 'multipleChoice'
  /** Ids of the options the learner has selected */
  selected: string[]
}

export interface HeadToTailConnectState {
  type: 'headToTailConnect'
  /** Fixed vector A (tail at origin) */
  vectorA: Vec2
  /** Vector B's displacement — length & direction stay fixed while dragging */
  vectorB: Vec2
  /** Current tail position of B (the draggable point) */
  bTail: Vec2
  /** Endpoint the student types once B is connected head-to-tail */
  endInput: Vec2
}

export interface HeadToTailDrawSumState {
  type: 'headToTailDrawSum'
  vectorA: Vec2
  vectorB: Vec2
  /** Position of the drawn a + b vector on the graph (phase 1) */
  sumTip: Vec2
  /** Learner-typed a + b components, asked once the drawn vector is correct (phase 2) */
  sumInput: Vec2
}

export interface HeadToTailFullState {
  type: 'headToTailFull'
  vectorA: Vec2
  vectorB: Vec2
  /** Tail of B — dragged to A's head to align (phase 1) */
  bTail: Vec2
  /** Drawn a + b vector (phase 2) */
  sumTip: Vec2
  /** Typed a + b components (phase 3) */
  sumInput: Vec2
}

export interface HeadToTailFreeState {
  type: 'headToTailFree'
  vectorA: Vec2
  vectorB: Vec2
  /** Tail of B — freely draggable from the origin */
  bTail: Vec2
  /** Drawn a + b vector — freely draggable once B has moved */
  sumTip: Vec2
  /** Typed a + b components — visible and editable from the start; this is what's graded */
  sumInput: Vec2
}

export interface NegateVectorState {
  type: 'negateVector'
  /** The original vector B (fixed reference). */
  baseVector: Vec2
  /** Draggable tip of the reversed vector (starts at baseVector). */
  tip: Vec2
  /** Typed −B components, asked once the arrow points to −B (phase 2). */
  vectorInput: Vec2
}

export interface VectorSubtractState {
  type: 'vectorSubtract'
  vectorA: Vec2
  vectorB: Vec2
  /** Current displacement of the −B arrow (starts at B, reversed by dragging the tip). */
  negDisp: Vec2
  /** Tail of the −B arrow — dragged to A's head once reversed. */
  negTail: Vec2
  /** Drawn A − B vector. */
  sumTip: Vec2
  /** Typed A − B components — this is what's graded. */
  sumInput: Vec2
}

export type QuestionInteractionState =
  | DrawVectorState
  | HeadToTailAddState
  | HeadToTailConnectState
  | HeadToTailDrawSumState
  | HeadToTailFullState
  | HeadToTailFreeState
  | ScalarMultiplyState
  | MultipleChoiceState
  | NegateVectorState
  | VectorSubtractState

export type LessonPhase = 'exploring' | 'correct' | 'incorrect'
