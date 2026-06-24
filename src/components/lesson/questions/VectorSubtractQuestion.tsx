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
  const reversed = equalsWithTolerance(state.negDisp, scale(vectorB, -1), tolerance)
  const negMoved = state.negTail[0] !== 0 || state.negTail[1] !== 0
  const sumStarted = state.sumTip[0] !== 0 || state.sumTip[1] !== 0

  // Q2 hides the equation until B is reversed; Q3–Q5 show it from the start.
  const showInput = question.gated ? reversed : true

  // Q2/Q3 use the A + (−B) form to reinforce "subtraction = adding the opposite".
  const additionForm = question.additionForm ?? false
  const negB: Vec2 = [-vectorB[0], -vectorB[1]]
  const sumName = additionForm ? 'A + (−B)' : 'A − B'

  const handleReverseDrag = useCallback(
    (position: Vec2) => {
      // While reversing, the −B arrow's tail stays at the origin, so the tip is its displacement.
      onStateChange({ ...state, negDisp: snapInteger(position) })
    },
    [onStateChange, state],
  )

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

  const reversePointer = useSvgPointer({
    bounds: { min: DRAG_MIN, max: DRAG_MAX },
    onDrag: handleReverseDrag,
    enabled: !disabled && !reversed,
    svgRef,
  })

  const tailPointer = useSvgPointer({
    bounds: { min: DRAG_MIN, max: DRAG_MAX },
    onDrag: handleTailDrag,
    enabled: !disabled && reversed,
    svgRef,
  })

  const sumPointer = useSvgPointer({
    bounds: { min: DRAG_MIN, max: DRAG_MAX },
    onDrag: handleSumDrag,
    enabled: !disabled && reversed,
    svgRef,
  })

  const [tailX, tailY] = mathToSvg(state.negTail)

  return (
    <div className="vector-subtract-question">
      {question.referenceLabel && (
        <p className="question-reference">{question.referenceLabel}</p>
      )}
      <CoordinatePlane ref={svgRef} min={PLANE_MIN} max={PLANE_MAX}>
        <Vector tip={vectorA} color="var(--lesson-vector-a)" label="A" dashed />
        {/* Hide the original B once it has been reversed so the graph isn't cluttered. */}
        {!reversed && <Vector tip={vectorB} color="var(--lesson-target)" label="B" dashed />}

        {!reversed ? (
          <Vector
            origin={state.negTail}
            tip={state.negDisp}
            color="var(--lesson-vector-b)"
            label="−B"
            draggable={!disabled}
            onHandlePointerDown={reversePointer.pointerHandlers.onPointerDown}
            onHandlePointerMove={reversePointer.pointerHandlers.onPointerMove}
            onHandlePointerUp={reversePointer.pointerHandlers.onPointerUp}
            onHandlePointerCancel={reversePointer.pointerHandlers.onPointerCancel}
          />
        ) : (
          <>
            <Vector
              origin={state.negTail}
              tip={state.negDisp}
              color="var(--lesson-vector-b)"
              label="−B"
            />
            {!disabled && (
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

        {reversed && negMoved && (
          <Vector
            tip={state.sumTip}
            color="var(--lesson-vector-sum)"
            label={sumStarted ? sumName : undefined}
            draggable={!disabled}
            onHandlePointerDown={sumPointer.pointerHandlers.onPointerDown}
            onHandlePointerMove={sumPointer.pointerHandlers.onPointerMove}
            onHandlePointerUp={sumPointer.pointerHandlers.onPointerUp}
            onHandlePointerCancel={sumPointer.pointerHandlers.onPointerCancel}
          />
        )}
      </CoordinatePlane>

      {!disabled && (
        <>
          {question.gated && !reversed ? (
            <p className="vector-subtract-question__help muted">
              First reverse B: drag the tip of the −B arrow through the origin to point the opposite
              way. Then connect it head-to-tail to A and draw {sumName}.
            </p>
          ) : (
            <>
              <p className="vector-subtract-question__status">
                {question.gated
                  ? `−B is ready! Now just add it: connect −B head-to-tail to A, draw ${sumName}, then enter it below.`
                  : 'Now try it on your own!'}
              </p>
              <p className="vector-subtract-question__help muted">
                {question.gated
                  ? `No more steps are checked — just enter the correct ${sumName} below to submit.`
                  : 'Reverse B and build the path however you like — no steps are checked. Just enter the correct A − B below to submit.'}
              </p>
            </>
          )}
        </>
      )}

      {showInput &&
        (additionForm ? (
          <div className="vector-subtract-question__equation">
            <ColumnVector value={vectorA} color="var(--lesson-vector-a)" label="vector A" />
            <span className="vector-equation__op" aria-hidden="true">
              +
            </span>
            <ColumnVector value={negB} color="var(--lesson-vector-b)" label="negative B" />
            <span className="vector-equation__op" aria-hidden="true">
              =
            </span>
            <VectorComponentInput
              name="A + (−B)"
              value={state.sumInput}
              onChange={handleInputChange}
              disabled={disabled}
              color="var(--lesson-vector-sum)"
            />
          </div>
        ) : (
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
        ))}
    </div>
  )
}
