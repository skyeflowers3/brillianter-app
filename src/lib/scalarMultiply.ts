import type { ScalarMultiplyQuestion, ScalarSliderConfig } from '../types/lesson'
import { scale, type Vec2 } from './vectorMath'

/** Default slider range when a question does not specify one. */
export const DEFAULT_SLIDER: ScalarSliderConfig = { min: -3, max: 3, step: 0.5 }

/** Slider value the learner starts from (identity scaling). */
export const INITIAL_SCALAR = 1

export function presetBaseVector(question: ScalarMultiplyQuestion): Vec2 {
  return [...question.correctAnswer.baseVector]
}

export function getSliderConfig(question: ScalarMultiplyQuestion): ScalarSliderConfig {
  return {
    min: question.slider?.min ?? DEFAULT_SLIDER.min,
    max: question.slider?.max ?? DEFAULT_SLIDER.max,
    step: question.slider?.step ?? DEFAULT_SLIDER.step,
  }
}

export function scaledVector(baseVector: Vec2, scalar: number): Vec2 {
  return scale(baseVector, scalar)
}

/**
 * Project a dragged point onto the line through the origin along `base`, returning the
 * signed scalar c such that c·base is the closest point on that line. This keeps the
 * scaled vector locked to A's direction no matter where the cursor moves.
 */
export function scalarFromPoint(base: Vec2, point: Vec2): number {
  const denom = base[0] * base[0] + base[1] * base[1]
  if (denom === 0) {
    return 0
  }
  return (point[0] * base[0] + point[1] * base[1]) / denom
}

/** Clamp the scalar to the configured range and snap it to the nearest step. */
export function snapScalar(value: number, config: ScalarSliderConfig): number {
  const clamped = Math.min(config.max, Math.max(config.min, value))
  const snapped = Math.round(clamped / config.step) * config.step
  return Math.round(snapped * 100) / 100
}

/** The vector the learner is working toward: c · A using the correct scalar. */
export function targetVector(question: ScalarMultiplyQuestion): Vec2 {
  return scale(question.correctAnswer.baseVector, question.correctAnswer.scalar)
}

/** Render a scalar without trailing ".0" for whole numbers. */
export function formatScalar(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
