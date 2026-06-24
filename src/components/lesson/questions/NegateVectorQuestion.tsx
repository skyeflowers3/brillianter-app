import { useCallback } from 'react'
import { CoordinatePlane } from '../../svg/CoordinatePlane'
import { Vector } from '../../svg/Vector'
import { useSvgPointer } from '../../../hooks/useSvgPointer'
import { equalsWithTolerance, scale, type Vec2 } from '../../../lib/vectorMath'
import type {
  NegateVectorQuestion as NegateVectorQuestionType,
  NegateVectorState,
} from '../../../types/lesson'
import { ColumnVector } from './ColumnVector'
import { VectorComponentInput } from './VectorComponentInput'

const PLANE_MIN = -5
const PLANE_MAX = 5
const DRAG_MIN = -4
const DRAG_MAX = 4

interface NegateVectorQuestionProps {
  question: NegateVectorQuestionType
  state: NegateVectorState
  onStateChange: (next: NegateVectorState) => void
  disabled?: boolean
}

function snapInteger([x, y]: Vec2): Vec2 {
  return [
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(x))),
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(y))),
  ]
}

export function NegateVectorQuestion({
  question,
  state,
  onStateChange,
  disabled = false,
}: NegateVectorQuestionProps) {
  const { baseVector } = state
  const tolerance = question.correctAnswer.tolerance
  const opposite = scale(baseVector, -1)
  const reversed = equalsWithTolerance(state.tip, opposite, tolerance)

  const handleTipDrag = useCallback(
    (position: Vec2) => {
      onStateChange({ ...state, tip: snapInteger(position) })
    },
    [onStateChange, state],
  )

  const handleInputChange = useCallback(
    (vectorInput: Vec2) => {
      onStateChange({ ...state, vectorInput })
    },
    [onStateChange, state],
  )

  const { svgRef, pointerHandlers } = useSvgPointer({
    bounds: { min: DRAG_MIN, max: DRAG_MAX },
    onDrag: handleTipDrag,
    enabled: !disabled,
  })

  return (
    <div className="negate-vector-question">
      {question.referenceLabel && (
        <p className="question-reference">{question.referenceLabel}</p>
      )}
      <CoordinatePlane ref={svgRef} min={PLANE_MIN} max={PLANE_MAX}>
        <Vector tip={baseVector} color="var(--lesson-target)" label="B" dashed />
        <Vector
          tip={state.tip}
          color="var(--lesson-vector-b)"
          label="−B"
          draggable={!disabled}
          onHandlePointerDown={pointerHandlers.onPointerDown}
          onHandlePointerMove={pointerHandlers.onPointerMove}
          onHandlePointerUp={pointerHandlers.onPointerUp}
          onHandlePointerCancel={pointerHandlers.onPointerCancel}
        />
      </CoordinatePlane>

      {reversed ? (
        <>
          <p className="negate-vector-question__status">
            That's −B: same length, opposite direction! Now, what is −B?
          </p>
          <div className="negate-vector-question__equation">
            <span className="vector-equation__op" aria-hidden="true">
              −
            </span>
            <ColumnVector value={baseVector} color="var(--lesson-target)" label="vector B" />
            <span className="vector-equation__op" aria-hidden="true">
              =
            </span>
            <VectorComponentInput
              name="negative B"
              value={state.vectorInput}
              onChange={handleInputChange}
              disabled={disabled}
              color="var(--lesson-vector-b)"
            />
          </div>
        </>
      ) : (
        !disabled && (
          <p className="negate-vector-question__help muted">
            Drag the tip across the origin to scale B by −1.
          </p>
        )
      )}
    </div>
  )
}
