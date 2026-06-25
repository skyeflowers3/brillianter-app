import { useCallback, useRef } from 'react'
import { CoordinatePlane } from '../../svg/CoordinatePlane'
import { Vector } from '../../svg/Vector'
import { useSvgPointer } from '../../../hooks/useSvgPointer'
import { mathToSvg } from '../../../lib/svgMath'
import { equalsWithTolerance, scale, type Vec2 } from '../../../lib/vectorMath'
import type {
  VectorSubtractQuestion as VectorSubtractQuestionType,
  VectorSubtractState,
} from '../../../types/lesson'
import { ColumnVector } from './ColumnVector'
import { VectorComponentInput } from './VectorComponentInput'

const PLANE_MIN = -5
const PLANE_MAX = 5
const DRAG_MIN = -4
const DRAG_MAX = 4

interface VectorSubtractQuestionProps {
  question: VectorSubtractQuestionType
  state: VectorSubtractState
  onStateChange: (next: VectorSubtractState) => void
  disabled?: boolean
}

function snapInteger([x, y]: Vec2): Vec2 {
  return [
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(x))),
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(y))),
  ]
}

export function VectorSubtractQuestion({
  question,
  state,
  onStateChange,
  disabled = false,
}: VectorSubtractQuestionProps) {
  const { vectorA, vectorB } = state
  const tolerance = question.correctAnswer.tolerance
  const negB: Vec2 = [-vectorB[0], -vectorB[1]]
  const reversed = equalsWithTolerance(state.negDisp, scale(vectorB, -1), tolerance)
  const connected = reversed && equalsWithTolerance(state.negTail, vectorA, tolerance)
  const negMoved = state.negTail[0] !== 0 || state.negTail[1] !== 0
  const sumStarted = state.sumTip[0] !== 0 || state.sumTip[1] !== 0

  // Guided (Q1–Q2) walks reverse → connect → draw → type. Freeform (Q3+) shows the equation right
  // away and only grades the typed answer, so B is draggable from the start and reversing is
  // optional.
  const guided = question.gated
  const showInput = guided ? reversed : true
  const tailEnabled = !disabled && (guided ? reversed : true)
  const sumEnabled = !disabled && (guided ? reversed : true)
  // In guided mode, before reversing we show B as a static dashed arrow next to the Reverse button.
  // Otherwise the B/−B arrow is the draggable one the learner connects head-to-tail.
  const showStaticB = guided && !reversed
  const showReverseButton = !disabled && !reversed
  const showSum = negMoved && (!guided || reversed)

  const handleReverse = useCallback(() => {
    onStateChange({ ...state, negDisp: negB })
  }, [negB, onStateChange, state])

  const handleTailDrag = useCallback(
    (position: Vec2) => {
      onStateChange({ ...state, negTail: snapInteger(position) })
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

  // Independent pointer hooks share one SVG ref so each handle only moves when it is grabbed.
  const svgRef = useRef<SVGSVGElement>(null)

  const tailPointer = useSvgPointer({
    bounds: { min: DRAG_MIN, max: DRAG_MAX },
    onDrag: handleTailDrag,
    enabled: tailEnabled,
    svgRef,
    value: state.negTail,
  })

  const sumPointer = useSvgPointer({
    bounds: { min: DRAG_MIN, max: DRAG_MAX },
    onDrag: handleSumDrag,
    enabled: sumEnabled,
    svgRef,
    value: state.sumTip,
  })

  const [tailX, tailY] = mathToSvg(state.negTail)

  return (
    <div className="vector-subtract-question">
      {question.referenceLabel && <p className="question-reference">{question.referenceLabel}</p>}

      <CoordinatePlane ref={svgRef} min={PLANE_MIN} max={PLANE_MAX}>
        <Vector tip={vectorA} color="var(--lesson-vector-a)" label="A" dashed />

        {showStaticB ? (
          <Vector tip={vectorB} color="var(--lesson-target)" label="B" dashed />
        ) : (
          <>
            {/* The B/−B arrow. Right after reversing it spins 180° from B's orientation to −B. */}
            <g>
              <Vector
                origin={state.negTail}
                tip={state.negDisp}
                color="var(--lesson-vector-b)"
                label={reversed ? '−B' : 'B'}
              />
              {reversed && !negMoved && !disabled && (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="180 0 0"
                  to="0 0 0"
                  dur="0.45s"
                  repeatCount="1"
                  fill="freeze"
                />
              )}
            </g>

            {tailEnabled && (
              <>
                <circle
                  cx={tailX}
                  cy={tailY}
                  r={0.3}
                  className="vector__handle"
                  style={{ fill: 'var(--lesson-vector-b)' }}
                  pointerEvents="all"
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
                  pointerEvents="all"
                  onPointerDown={tailPointer.pointerHandlers.onPointerDown}
                  onPointerMove={tailPointer.pointerHandlers.onPointerMove}
                  onPointerUp={tailPointer.pointerHandlers.onPointerUp}
                  onPointerCancel={tailPointer.pointerHandlers.onPointerCancel}
                />
              </>
            )}
          </>
        )}

        {showSum && (
          <Vector
            tip={state.sumTip}
            color="var(--lesson-vector-sum)"
            label={sumStarted ? 'A − B' : undefined}
            draggable={!disabled}
            onHandlePointerDown={sumPointer.pointerHandlers.onPointerDown}
            onHandlePointerMove={sumPointer.pointerHandlers.onPointerMove}
            onHandlePointerUp={sumPointer.pointerHandlers.onPointerUp}
            onHandlePointerCancel={sumPointer.pointerHandlers.onPointerCancel}
          />
        )}
      </CoordinatePlane>

      {showReverseButton && (
        <div className="vector-subtract-question__reverse">
          <button
            type="button"
            className="button button--primary vector-subtract-question__reverse-btn"
            onClick={handleReverse}
          >
            Reverse B
          </button>
          {guided && (
            <p className="vector-subtract-question__help muted">
              Step 1: reverse B. Click the button to flip B around the origin and turn it into −B.
            </p>
          )}
        </div>
      )}

      {!disabled && guided && reversed && (
        <p className="vector-subtract-question__status">
          {!connected
            ? 'Now connect −B head-to-tail: drag its tail to the head of A.'
            : !sumStarted
              ? 'Now draw A − B from the origin to the end of the path.'
              : 'Now enter A − B below.'}
        </p>
      )}

      {!disabled && !guided && (
        <p className="vector-subtract-question__status">
          Work it out on the grid if it helps, then enter A − B below.
        </p>
      )}

      {showInput && (
        <div className="vector-subtract-question__equation">
          <ColumnVector value={vectorA} color="var(--lesson-vector-a)" label="vector A" />
          <span className="vector-equation__op" aria-hidden="true">
            −
          </span>
          <ColumnVector value={vectorB} color="var(--lesson-target)" label="vector B" />
          <span className="vector-equation__op" aria-hidden="true">
            =
          </span>
          <VectorComponentInput
            name="A − B"
            value={state.sumInput}
            onChange={handleInputChange}
            disabled={disabled}
            color="var(--lesson-vector-sum)"
          />
        </div>
      )}
    </div>
  )
}
