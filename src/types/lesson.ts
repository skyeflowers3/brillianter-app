import type { Vec2 } from '../lib/vectorMath'

export type QuestionType =
  | 'drawVector'
  | 'readVector'
  | 'findMagnitude'
  | 'headToTailAdd'
  | 'headToTailConnect'
  | 'headToTailDrawSum'
  | 'headToTailFull'
  | 'headToTailFree'
  | 'scalarSlider'
  | 'multipleChoice'
  | 'negateVector'
  | 'vectorSubtract'
  | 'linearCombo'
  | 'constructCombo'

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

export interface ReadVectorAnswer {
  type: 'readVector'
  /** The vector drawn on the graph; the learner types these components. */
  vector: Vec2
  tolerance: number
}

export interface FindMagnitudeAnswer {
  type: 'findMagnitude'
  /** The vector drawn on the graph (with its right triangle). */
  vector: Vec2
  /** The magnitude the learner must type. */
  magnitude: number
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

/**
 * A span / linear-combination question. The learner scales one or two base vectors with sliders to
 * reach a highlighted target point, or judges whether the target is reachable at all.
 */
export type LinearComboMode = 'reach' | 'reachable'

export interface LinearComboCoefficientConfig {
  min: number
  max: number
  step: number
}

export interface LinearComboAnswer {
  type: 'linearCombo'
  /**
   * Base vectors the learner scales. `vectorB` is omitted for single-vector questions. Stored as two
   * flat fields (rather than a nested `Vec2[]`) so the question seeds cleanly to Firestore, which
   * does not allow arrays of arrays.
   */
  vectorA: Vec2
  vectorB?: Vec2
  /** Highlighted target point. */
  target: Vec2
  /**
   * Optional follow-up targets for 'reach' questions. After the learner lands on `target`, the next
   * target appears, and so on. Stored as flat fields (not a `Vec2[]`) for Firestore compatibility.
   */
  target2?: Vec2
  target3?: Vec2
  /** Coefficients that reach the target (for hints/explanations); omitted when unreachable. */
  solution?: number[]
  /** Whether the target can be reached — used by 'reachable' mode. */
  reachable: boolean
  tolerance: number
}

/**
 * 'construct' = build a prescribed cA + dB and read off the result;
 * 'findScalars' = reach a given point, then enter the scalars c and d that produce it;
 * 'recognize' = decide yes/no whether a target is any combination of A and B.
 */
export type ConstructComboMode = 'construct' | 'findScalars' | 'recognize'

export interface ConstructComboAnswer {
  type: 'constructCombo'
  /** The two base vectors the learner scales and connects head-to-tail. */
  vectorA: Vec2
  vectorB: Vec2
  /** Target coefficients (construct mode) — also the solution for a reachable recognize target. */
  coefA: number
  coefB: number
  /** Highlighted target point. In construct mode this equals coefA·A + coefB·B. */
  target: Vec2
  /** recognize mode: whether the target is actually a linear combination of A and B. */
  reachable?: boolean
  tolerance: number
}

export type QuestionAnswer =
  | DrawVectorAnswer
  | ReadVectorAnswer
  | FindMagnitudeAnswer
  | HeadToTailAddAnswer
  | HeadToTailConnectAnswer
  | HeadToTailDrawSumAnswer
  | HeadToTailFullAnswer
  | HeadToTailFreeAnswer
  | ScalarMultiplyAnswer
  | MultipleChoiceAnswer
  | NegateVectorAnswer
  | VectorSubtractAnswer
  | LinearComboAnswer
  | ConstructComboAnswer

export interface DrawVectorQuestion {
  id: string
  type: 'drawVector'
  prompt: string
  correctAnswer: DrawVectorAnswer
  hint: string
  explanation: string
  order: number
}

export interface ReadVectorQuestion {
  id: string
  type: 'readVector'
  prompt: string
  correctAnswer: ReadVectorAnswer
  hint: string
  explanation: string
  order: number
}

export interface FindMagnitudeQuestion {
  id: string
  type: 'findMagnitude'
  prompt: string
  correctAnswer: FindMagnitudeAnswer
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
  /** Optional plane bounds (default -8..8); widen for large targets like ⟨−9, −6⟩. */
  planeMin?: number
  planeMax?: number
  /** Manual nudge for the "A" label, in grid units (x right, y up). Defaults to [0, 1.2]. */
  labelOffset?: Vec2
  /**
   * When false, the typed answer is available immediately and the learner can submit with just an
   * answer (no need to land the drag first). Defaults to gated (true) for the guided early
   * questions. Correctness still checks both the graph and the typed answer.
   */
  gated?: boolean
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

export interface LinearComboQuestion {
  id: string
  type: 'linearCombo'
  /** 'reach' = adjust coefficients to land on the target; 'reachable' = answer yes/no. */
  mode: LinearComboMode
  /**
   * How the learner scales the vector. 'slider' (default) shows a range slider per coefficient;
   * 'drag' lets them grab the head of the vector and drag it (single-vector questions only).
   */
  control?: 'slider' | 'drag'
  /**
   * Optional reachable-region overlay: 'line' highlights the span line through the origin (for
   * parallel vectors), 'plane' shades the whole plane (for independent vectors).
   */
  region?: 'line' | 'plane'
  prompt: string
  /** Optional reference vectors shown above the plane (e.g. A = ⟨1, 0⟩, B = ⟨0, 1⟩). */
  referenceLabel?: string
  /** Slider range shared by every coefficient (default -4..4 step 0.5). */
  coefficient?: LinearComboCoefficientConfig
  /** Optional plane bounds (default -6..6). */
  planeMin?: number
  planeMax?: number
  correctAnswer: LinearComboAnswer
  hint: string
  explanation: string
  order: number
}

export interface ConstructComboQuestion {
  id: string
  type: 'constructCombo'
  /** 'construct' = build the prescribed cA + dB; 'recognize' = decide if the target is reachable. */
  mode: ConstructComboMode
  /**
   * When true (guided), each construction step (scale A → scale B → connect → draw) must be
   * complete before submitting. When false (independent), only the typed answer is graded.
   */
  gated?: boolean
  prompt: string
  /** Optional reference vectors shown above the plane (e.g. A = ⟨2, 1⟩, B = ⟨1, 2⟩). */
  referenceLabel?: string
  /** The expression being built, shown on the equation row (e.g. "2A + B"). */
  expressionLabel?: string
  /** Drag range for each scale factor (default -4..4 step 0.5). */
  coefficient?: LinearComboCoefficientConfig
  /** Optional plane bounds (default -8..8). */
  planeMin?: number
  planeMax?: number
  correctAnswer: ConstructComboAnswer
  hint: string
  explanation: string
  order: number
}

export type Question =
  | DrawVectorQuestion
  | ReadVectorQuestion
  | FindMagnitudeQuestion
  | HeadToTailAddQuestion
  | HeadToTailConnectQuestion
  | HeadToTailDrawSumQuestion
  | HeadToTailFullQuestion
  | HeadToTailFreeQuestion
  | ScalarMultiplyQuestion
  | MultipleChoiceQuestion
  | NegateVectorQuestion
  | VectorSubtractQuestion
  | LinearComboQuestion
  | ConstructComboQuestion

export interface LessonIntro {
  title: string
  paragraphs: string[]
  /** Optional example vector rendered on a coordinate plane. */
  sampleVector?: Vec2
  sampleVectorLabel?: string
  /** Optional animated "movement" example: the right-then-up path from the origin to this point. */
  sampleMovement?: Vec2
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
  /** Optional linear-combination example, animated as scale → leave → connect → draw cA + dB. */
  sampleCombination?: {
    vectorA: Vec2
    vectorB: Vec2
    coefA: number
    coefB: number
  }
}

export interface LessonInterstitialSegment {
  /** 'math' lines render in a centered monospace style; 'text' lines render as paragraphs. */
  type: 'text' | 'math'
  value: string
}

/** Optional vector diagram on an interstitial page, with optional angle/magnitude labels. */
export interface LessonInterstitialFigure {
  vector: Vec2
  angleLabel?: string
  magnitudeLabel?: string
}

/**
 * Optional "span" diagram: one or more vectors plus the line of all reachable points through the
 * origin. With two parallel vectors it visually shows they share a single line.
 */
export interface LessonInterstitialSpanFigure {
  vectors: Vec2[]
}

export interface LessonInterstitial {
  id: string
  /** The interstitial appears after the user finishes the question with this id. */
  afterQuestionId: string
  heading?: string
  segments: LessonInterstitialSegment[]
  figure?: LessonInterstitialFigure
  spanFigure?: LessonInterstitialSpanFigure
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

export interface ReadVectorState {
  type: 'readVector'
  /** Learner-typed components of the vector shown on the graph. */
  vectorInput: Vec2
}

export interface FindMagnitudeState {
  type: 'findMagnitude'
  /** Learner-typed magnitude of the vector shown on the graph. */
  magnitudeInput: number
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

export interface LinearComboState {
  type: 'linearCombo'
  /** Current coefficient values, one per base vector. */
  coefficients: number[]
  /** Yes/No answer for 'reachable' mode (null until chosen). */
  reachableInput: 'yes' | 'no' | null
  /** Which target in the sequence is currently active (for multi-target 'reach' questions). */
  targetIndex?: number
}

export interface ConstructComboState {
  type: 'constructCombo'
  vectorA: Vec2
  vectorB: Vec2
  /** Current scale factor on A — set by dragging A's head along A's line. */
  aScale: number
  /** Current scale factor on B — set by dragging B's head along B's line. */
  bScale: number
  /** Tail of the scaled B arrow — dragged to the head of scaled A to connect head-to-tail. */
  bTail: Vec2
  /** Drawn result vector tip (construct mode draw step). */
  resultTip: Vec2
  /** Typed result coordinates (construct mode) — this is what's graded. */
  resultInput: Vec2
  /** Typed scalar c (findScalars mode). */
  coefAInput: number
  /** Typed scalar d (findScalars mode). */
  coefBInput: number
  /** Yes/No verdict (recognize mode). */
  reachableInput: 'yes' | 'no' | null
}

export type QuestionInteractionState =
  | DrawVectorState
  | ReadVectorState
  | FindMagnitudeState
  | HeadToTailAddState
  | HeadToTailConnectState
  | HeadToTailDrawSumState
  | HeadToTailFullState
  | HeadToTailFreeState
  | ScalarMultiplyState
  | MultipleChoiceState
  | NegateVectorState
  | VectorSubtractState
  | LinearComboState
  | ConstructComboState

export type LessonPhase = 'exploring' | 'correct' | 'incorrect'
