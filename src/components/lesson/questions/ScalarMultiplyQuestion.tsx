import { useCallback } from 'react'
import { CoordinatePlane } from '../../svg/CoordinatePlane'
import { Vector } from '../../svg/Vector'
import { useSvgPointer } from '../../../hooks/useSvgPointer'
import {
  formatScalar,
  getSliderConfig,
  presetBaseVector,
  scalarFromPoint,
  scaledVector,
  snapScalar,
} from '../../../lib/scalarMultiply'
import type { Vec2 } from '../../../lib/vectorMath'
import type { ScalarMultiplyQuestion, ScalarMultiplyState } from '../../../types/lesson'
import { ColumnVector } from './ColumnVector'
import { ScalarValueInput } from './ScalarValueInput'
import { VectorComponentInput } from './VectorComponentInput'

const DEFAULT_PLANE_MIN = -8
const DEFAULT_PLANE_MAX = 8

interface ScalarMultiplyQuestionProps {
  question: ScalarMultiplyQuestion
  state: ScalarMultiplyState
  onStateChange: (next: ScalarMultiplyState) => void
  disabled?: boolean
}

export function ScalarMultiplyQuestion({
  question,
  state,
  onStateChange,
  disabled = false,
}: ScalarMultiplyQuestionProps) {
  const planeMin = question.planeMin ?? DEFAULT_PLANE_MIN
  const planeMax = question.planeMax ?? DEFAULT_PLANE_MAX
  const baseVector = presetBaseVector(question)
  const sliderConfig = getSliderConfig(question)
  const scaled = scaledVector(baseVector, state.scalar)
  const answer = question.correctAnswer
  const isFindScalar = question.mode === 'findScalar'
  const sliderCorrect = Math.abs(state.scalar - answer.scalar) <= answer.tolerance
  // Guided questions reveal the answer only after the drag lands; ungated ones show it immediately.
  const guided = question.gated !== false
  const showAnswer = guided ? sliderCorrect : true

  // Show the live scalar while building a vector, but hide it when the learner must deduce c.
  const scalarLabel = isFindScalar ? 'c = ?' : `c = ${formatScalar(state.scalar)}`

  const handleHeadDrag = useCallback(
    (position: Vec2) => {
      // Lock the angle: project the cursor onto A's line, then snap the scale factor.
      const scalar = snapScalar(scalarFromPoint(baseVector, position), sliderConfig)
      onStateChange({ ...state, scalar })
    },
    [baseVector, onStateChange, sliderConfig, state],
  )

  const handleVectorInput = useCallback(
    (vectorInput: Vec2) => {
      onStateChange({ ...state, vectorInput })
    },
    [onStateChange, state],
  )

  const handleScalarInput = useCallback(
    (scalarInput: number) => {
      onStateChange({ ...state, scalarInput })
    },
    [onStateChange, state],
  )

  const { svgRef, pointerHandlers } = useSvgPointer({
    bounds: { min: planeMin, max: planeMax },
    onDrag: handleHeadDrag,
    enabled: !disabled,
    value: scaled,
  })

  return (
    <div className="scalar-multiply-question">
      {question.referenceLabel && (
        <p className="scalar-multiply-question__reference">{question.referenceLabel}</p>
      )}
      <CoordinatePlane ref={svgRef} min={planeMin} max={planeMax}>
        <Vector
          tip={baseVector}
          color="var(--lesson-vector-a)"
          label="A"
          labelOffset={question.labelOffset ?? [0, 1.2]}
          dashed
        />
        <Vector
          tip={scaled}
          color="var(--lesson-vector-sum)"
          label={scalarLabel}
          draggable={!disabled}
          onHandlePointerDown={pointerHandlers.onPointerDown}
          onHandlePointerMove={pointerHandlers.onPointerMove}
          onHandlePointerUp={pointerHandlers.onPointerUp}
          onHandlePointerCancel={pointerHandlers.onPointerCancel}
        />
      </CoordinatePlane>

      {showAnswer ? (
        <>
          <p className="scalar-multiply-question__status">
            {/* Only guided questions reveal that the graph step is done. Ungated questions stay
                neutral so the learner gets no hint about correctness before submitting. */}
            {guided && sliderCorrect
              ? isFindScalar
                ? 'c · A matches the target! Now, what is the scalar c?'
                : "You've scaled A. Now, what is the resulting vector?"
              : isFindScalar
                ? 'Enter the scalar c — and line up c · A with the target on the graph.'
                : 'Enter the resulting vector — and scale A to match on the graph.'}
          </p>
          {isFindScalar ? (
            <div className="scalar-multiply-question__answer">
              <ScalarValueInput
                value={state.scalarInput}
                onChange={handleScalarInput}
                disabled={disabled}
                color="var(--lesson-vector-sum)"
              />
            </div>
          ) : (
            <div className="scalar-multiply-question__equation">
              <span className="scalar-multiply-question__coef">{formatScalar(state.scalar)}</span>
              <span className="vector-equation__op" aria-hidden="true">
                ·
              </span>
              <ColumnVector value={baseVector} color="var(--lesson-vector-a)" label="vector A" />
              <span className="vector-equation__op" aria-hidden="true">
                =
              </span>
              <VectorComponentInput
                name="scaled vector"
                value={state.vectorInput}
                onChange={handleVectorInput}
                disabled={disabled}
                color="var(--lesson-vector-sum)"
              />
            </div>
          )}
        </>
      ) : (
        !disabled && (
          <p className="scalar-multiply-question__help muted">
            {isFindScalar
              ? "Drag the head of the solid vector along A's line until it reaches the target point in the question. Use the grid numbers to check."
              : "Drag the head of the solid vector to scale A. It stays on A's line, and c shows the scale factor."}
          </p>
        )
      )}
    </div>
  )
}
