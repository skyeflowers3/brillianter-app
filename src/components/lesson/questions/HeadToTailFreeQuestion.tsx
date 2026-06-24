import { useCallback, useRef } from 'react'
import { CoordinatePlane } from '../../svg/CoordinatePlane'
import { Vector } from '../../svg/Vector'
import { useSvgPointer } from '../../../hooks/useSvgPointer'
import { mathToSvg } from '../../../lib/svgMath'
import type { Vec2 } from '../../../lib/vectorMath'
import type {
  HeadToTailFreeQuestion as HeadToTailFreeQuestionType,
  HeadToTailFreeState,
} from '../../../types/lesson'
import { ColumnVector } from './ColumnVector'
import { VectorComponentInput } from './VectorComponentInput'

const PLANE_MIN = -5
const PLANE_MAX = 5
const DRAG_MIN = -4
const DRAG_MAX = 4

interface HeadToTailFreeQuestionProps {
  question: HeadToTailFreeQuestionType
  state: HeadToTailFreeState
  onStateChange: (next: HeadToTailFreeState) => void
  disabled?: boolean
}

function snapInteger([x, y]: Vec2): Vec2 {
  return [
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(x))),
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(y))),
  ]
}

export function HeadToTailFreeQuestion({
  state,
  onStateChange,
  disabled = false,
}: HeadToTailFreeQuestionProps) {
  const { vectorA, vectorB } = state
  const bMoved = state.bTail[0] !== 0 || state.bTail[1] !== 0
  const sumStarted = state.sumTip[0] !== 0 || state.sumTip[1] !== 0

  const handleBDrag = useCallback(
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

  // Two independent pointer hooks share one SVG ref so each handle only moves
  // when it is the one being clicked and held.
  const svgRef = useRef<SVGSVGElement>(null)

  const bPointer = useSvgPointer({
    bounds: { min: DRAG_MIN, max: DRAG_MAX },
    onDrag: handleBDrag,
    enabled: !disabled,
    svgRef,
  })

  const sumPointer = useSvgPointer({
    bounds: { min: DRAG_MIN, max: DRAG_MAX },
    onDrag: handleSumDrag,
    enabled: !disabled && bMoved,
    svgRef,
  })

  const [tailX, tailY] = mathToSvg(state.bTail)

  return (
    <div className="head-to-tail-free-question">
      <CoordinatePlane ref={svgRef} min={PLANE_MIN} max={PLANE_MAX}>
        <Vector tip={vectorA} color="var(--lesson-vector-a)" label="a" dashed />
        <Vector origin={state.bTail} tip={vectorB} color="var(--lesson-vector-b)" label="b" />

        {bMoved && (
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

        {!disabled && (
          <>
            <circle
              cx={tailX}
              cy={tailY}
              r={0.3}
              className="vector__handle"
              style={{ fill: 'var(--lesson-vector-b)' }}
              pointerEvents="all"
              onPointerDown={bPointer.pointerHandlers.onPointerDown}
              onPointerMove={bPointer.pointerHandlers.onPointerMove}
              onPointerUp={bPointer.pointerHandlers.onPointerUp}
              onPointerCancel={bPointer.pointerHandlers.onPointerCancel}
            />
            <circle
              cx={tailX}
              cy={tailY}
              r={0.5}
              className="vector__hit-target"
              pointerEvents="all"
              onPointerDown={bPointer.pointerHandlers.onPointerDown}
              onPointerMove={bPointer.pointerHandlers.onPointerMove}
              onPointerUp={bPointer.pointerHandlers.onPointerUp}
              onPointerCancel={bPointer.pointerHandlers.onPointerCancel}
            />
          </>
        )}
      </CoordinatePlane>

      {!disabled && (
        <>
          <p className="head-to-tail-free-question__status">Now try it on your own!</p>
          <p className="head-to-tail-free-question__help muted">
            Move b and draw a + b however you like — no steps are checked. Just enter the correct
            a + b below to submit.
          </p>
        </>
      )}

      <div className="head-to-tail-free-question__equation">
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
    </div>
  )
}
