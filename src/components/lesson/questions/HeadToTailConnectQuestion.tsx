import { useCallback } from 'react'
import { CoordinatePlane } from '../../svg/CoordinatePlane'
import { Vector } from '../../svg/Vector'
import { useSvgPointer } from '../../../hooks/useSvgPointer'
import { mathToSvg } from '../../../lib/svgMath'
import { add, equalsWithTolerance, type Vec2 } from '../../../lib/vectorMath'
import type {
  HeadToTailConnectQuestion as HeadToTailConnectQuestionType,
  HeadToTailConnectState,
} from '../../../types/lesson'
import { ColumnVector } from './ColumnVector'
import { VectorComponentInput } from './VectorComponentInput'

const PLANE_MIN = -5
const PLANE_MAX = 5
const DRAG_MIN = -4
const DRAG_MAX = 4

interface HeadToTailConnectQuestionProps {
  question: HeadToTailConnectQuestionType
  state: HeadToTailConnectState
  onStateChange: (next: HeadToTailConnectState) => void
  disabled?: boolean
}

function snapInteger([x, y]: Vec2): Vec2 {
  return [
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(x))),
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(y))),
  ]
}

export function HeadToTailConnectQuestion({
  question,
  state,
  onStateChange,
  disabled = false,
}: HeadToTailConnectQuestionProps) {
  const { vectorA, vectorB } = state
  const tolerance = question.correctAnswer.tolerance
  const connected = equalsWithTolerance(state.bTail, vectorA, tolerance)

  const handleTailDrag = useCallback(
    (position: Vec2) => {
      onStateChange({ ...state, bTail: snapInteger(position) })
    },
    [onStateChange, state],
  )

  const handleEndChange = useCallback(
    (next: Vec2) => {
      onStateChange({ ...state, endInput: next })
    },
    [onStateChange, state],
  )

  const { svgRef, pointerHandlers } = useSvgPointer({
    bounds: { min: DRAG_MIN, max: DRAG_MAX },
    onDrag: handleTailDrag,
    enabled: !disabled,
    value: state.bTail,
  })

  const [tailX, tailY] = mathToSvg(state.bTail)

  return (
    <div className="head-to-tail-connect-question">
      <CoordinatePlane ref={svgRef} min={PLANE_MIN} max={PLANE_MAX}>
        <Vector tip={vectorA} color="var(--lesson-vector-a)" label="a" dashed />
        <Vector origin={state.bTail} tip={vectorB} color="var(--lesson-vector-b)" label="b" />

        {connected && (
          <g className="htc-sum-enter">
            <Vector
              tip={add(vectorA, vectorB)}
              color="var(--lesson-vector-sum)"
              label="a + b"
            />
          </g>
        )}

        {!disabled && (
          <>
            <circle
              cx={tailX}
              cy={tailY}
              r={0.3}
              className="vector__handle"
              style={{ fill: 'var(--lesson-vector-b)' }}
              pointerEvents="all"
              {...pointerHandlers}
            />
            <circle
              cx={tailX}
              cy={tailY}
              r={0.5}
              className="vector__hit-target"
              pointerEvents="all"
              {...pointerHandlers}
            />
          </>
        )}
      </CoordinatePlane>

      {connected ? (
        <>
          <p className="head-to-tail-connect-question__status">
            Correct — a and b are connected head-to-tail! Now, where does the path a + b end?
          </p>
          <div className="head-to-tail-connect-question__equation">
            <ColumnVector value={vectorA} color="var(--lesson-vector-a)" label="vector a" />
            <span className="vector-equation__op" aria-hidden="true">
              +
            </span>
            <ColumnVector value={vectorB} color="var(--lesson-vector-b)" label="vector b" />
            <span className="vector-equation__op" aria-hidden="true">
              =
            </span>
            <VectorComponentInput
              name="a + b"
              value={state.endInput}
              onChange={handleEndChange}
              disabled={disabled}
              color="var(--lesson-vector-sum)"
            />
          </div>
        </>
      ) : (
        !disabled && (
          <p className="head-to-tail-connect-question__help muted">
            Vector a is fixed. Drag the tail of vector b (its handle) so it meets the head of a.
          </p>
        )
      )}
    </div>
  )
}
