import { useCallback, useRef } from 'react'
import { CoordinatePlane } from '../../svg/CoordinatePlane'
import { Vector } from '../../svg/Vector'
import { useSvgPointer } from '../../../hooks/useSvgPointer'
import { mathToSvg } from '../../../lib/svgMath'
import { add, equalsWithTolerance, type Vec2 } from '../../../lib/vectorMath'
import type {
  HeadToTailFullQuestion as HeadToTailFullQuestionType,
  HeadToTailFullState,
} from '../../../types/lesson'
import { ColumnVector } from './ColumnVector'
import { VectorComponentInput } from './VectorComponentInput'

const PLANE_MIN = -5
const PLANE_MAX = 5
const DRAG_MIN = -4
const DRAG_MAX = 4

interface HeadToTailFullQuestionProps {
  question: HeadToTailFullQuestionType
  state: HeadToTailFullState
  onStateChange: (next: HeadToTailFullState) => void
  disabled?: boolean
}

function snapInteger([x, y]: Vec2): Vec2 {
  return [
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(x))),
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(y))),
  ]
}

export function HeadToTailFullQuestion({
  question,
  state,
  onStateChange,
  disabled = false,
}: HeadToTailFullQuestionProps) {
  const { vectorA, vectorB } = state
  const tolerance = question.correctAnswer.tolerance
  const target = add(vectorA, vectorB)
  const connected = equalsWithTolerance(state.bTail, vectorA, tolerance)
  const sumDrawn = connected && equalsWithTolerance(state.sumTip, target, tolerance)
  const sumStarted = state.sumTip[0] !== 0 || state.sumTip[1] !== 0

  const handleTailDrag = useCallback(
    (position: Vec2) => {
      onStateChange({ ...state, bTail: snapInteger(position) })
    },
    [onStateChange, state],
  )

  const handleSumDrag = useCallback(
    (position: Vec2) => {
      onStateChange({ ...state, sumTip: snapInteger(position) })
    },
    [onStateChange, state],
  )

  const handleInputChange = useCallback(
    (sumInput: Vec2) => {
      onStateChange({ ...state, sumInput })
    },
    [onStateChange, state],
  )

  // Independent pointer hooks share one SVG ref so each handle controls only its own vector. Once b
  // is connected its hook is disabled (b locks in place) without unmounting the captured handle
  // mid-drag, which previously dropped pointer capture and made connecting feel glitchy.
  const svgRef = useRef<SVGSVGElement>(null)

  const tailPointer = useSvgPointer({
    bounds: { min: DRAG_MIN, max: DRAG_MAX },
    onDrag: handleTailDrag,
    enabled: !disabled && !connected,
    svgRef,
    value: state.bTail,
  })

  const sumPointer = useSvgPointer({
    bounds: { min: DRAG_MIN, max: DRAG_MAX },
    onDrag: handleSumDrag,
    enabled: !disabled && connected,
    svgRef,
    value: state.sumTip,
  })

  const [tailX, tailY] = mathToSvg(state.bTail)

  return (
    <div className="head-to-tail-full-question">
      <CoordinatePlane ref={svgRef} min={PLANE_MIN} max={PLANE_MAX}>
        <Vector tip={vectorA} color="var(--lesson-vector-a)" label="a" dashed />
        <Vector origin={state.bTail} tip={vectorB} color="var(--lesson-vector-b)" label="b" />

        {/* The b-tail handle stays mounted after connecting (its hook just disables) so an in-flight
            drag never loses pointer capture. Once connected it is hidden and click-through. */}
        {!disabled && (
          <>
            <circle
              cx={tailX}
              cy={tailY}
              r={0.3}
              className="vector__handle"
              style={{ fill: 'var(--lesson-vector-b)', opacity: connected ? 0 : 1 }}
              pointerEvents={connected ? 'none' : 'all'}
              onPointerDown={tailPointer.pointerHandlers.onPointerDown}
              onPointerMove={tailPointer.pointerHandlers.onPointerMove}
              onPointerUp={tailPointer.pointerHandlers.onPointerUp}
              onPointerCancel={tailPointer.pointerHandlers.onPointerCancel}
            />
            <circle
              cx={tailX}
              cy={tailY}
              r={0.5}
              className="vector__hit-target"
              pointerEvents={connected ? 'none' : 'all'}
              onPointerDown={tailPointer.pointerHandlers.onPointerDown}
              onPointerMove={tailPointer.pointerHandlers.onPointerMove}
              onPointerUp={tailPointer.pointerHandlers.onPointerUp}
              onPointerCancel={tailPointer.pointerHandlers.onPointerCancel}
            />
          </>
        )}

        {connected && (
          <Vector
            tip={state.sumTip}
            color="var(--lesson-vector-sum)"
            label={sumStarted ? 'a + b' : undefined}
            draggable={!disabled}
            onHandlePointerDown={sumPointer.pointerHandlers.onPointerDown}
            onHandlePointerMove={sumPointer.pointerHandlers.onPointerMove}
            onHandlePointerUp={sumPointer.pointerHandlers.onPointerUp}
            onHandlePointerCancel={sumPointer.pointerHandlers.onPointerCancel}
          />
        )}
      </CoordinatePlane>

      {!connected ? (
        !disabled && (
          <p className="head-to-tail-full-question__help muted">
            Vectors a and b both start at the origin. Drag the tail of b so it meets the head of a.
          </p>
        )
      ) : !sumDrawn ? (
        <p className="head-to-tail-full-question__status">
          Aligned head-to-tail! Now drag the a + b vector from the origin to the end of the path.
        </p>
      ) : (
        <>
          <p className="head-to-tail-full-question__status">
            That's the a + b path! Now, what is a + b?
          </p>
          <div className="head-to-tail-full-question__equation">
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
              value={state.sumInput}
              onChange={handleInputChange}
              disabled={disabled}
              color="var(--lesson-vector-sum)"
            />
          </div>
        </>
      )}
    </div>
  )
}
