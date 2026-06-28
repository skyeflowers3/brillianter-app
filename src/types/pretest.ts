import type {
  ConstructComboAnswer,
  ConstructComboMode,
  DrawVectorAnswer,
  HeadToTailFreeAnswer,
  LinearComboCoefficientConfig,
  ScalarMode,
  ScalarMultiplyAnswer,
  ScalarSliderConfig,
  Vec2,
  VectorSubtractAnswer,
} from './lesson'

/** The unguided interaction types a pre-lesson attempt can use. */
export type PretestType =
  | 'drawVector'
  | 'headToTailFree'
  | 'vectorSubtract'
  | 'scalarSlider'
  | 'constructCombo'

/**
 * Reveal copy shown after the learner commits a guess. `correct` fires when the guess lands within
 * the grading `tolerance`; `close` fires when it is within the more generous `closeThreshold`;
 * otherwise `default` is shown. The reveal still never scores or gates.
 */
export interface PretestReveal {
  default: string
  close: string
  correct: string
}

interface PretestBase {
  id: string
  prompt: string
  /**
   * A generous closeness band (in grid units), separate from and more forgiving than the grading
   * `tolerance`. It only chooses warm vs. neutral reveal copy; it never scores or gates.
   */
  closeThreshold: number
  reveal: PretestReveal
}

export interface DrawVectorPretest extends PretestBase {
  type: 'drawVector'
  correctAnswer: DrawVectorAnswer
}

export interface HeadToTailFreePretest extends PretestBase {
  type: 'headToTailFree'
  correctAnswer: HeadToTailFreeAnswer
}

export interface VectorSubtractPretest extends PretestBase {
  type: 'vectorSubtract'
  /** Pretests are always freeform (ungated): the learner just commits a result vector. */
  gated?: boolean
  correctAnswer: VectorSubtractAnswer
}

export interface ScalarSliderPretest extends PretestBase {
  type: 'scalarSlider'
  mode: ScalarMode
  gated?: boolean
  slider?: ScalarSliderConfig
  referenceLabel?: string
  planeMin?: number
  planeMax?: number
  labelOffset?: Vec2
  correctAnswer: ScalarMultiplyAnswer
}

export interface ConstructComboPretest extends PretestBase {
  type: 'constructCombo'
  mode: ConstructComboMode
  gated?: boolean
  expressionLabel?: string
  referenceLabel?: string
  coefficient?: LinearComboCoefficientConfig
  correctAnswer: ConstructComboAnswer
}

/**
 * A single never-scored pre-lesson attempt. It carries the per-type config that the existing
 * interaction renderer needs, plus a `closeThreshold` and `reveal` copy. It deliberately omits the
 * lesson-question fields that have no meaning here (hint, explanation, order).
 */
export type PretestQuestion =
  | DrawVectorPretest
  | HeadToTailFreePretest
  | VectorSubtractPretest
  | ScalarSliderPretest
  | ConstructComboPretest
