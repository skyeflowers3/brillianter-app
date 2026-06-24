import { useCallback } from 'react'
import { CoordinatePlane } from '../../svg/CoordinatePlane'
import { Vector } from '../../svg/Vector'
import { useSvgPointer } from '../../../hooks/useSvgPointer'
import { add, equalsWithTolerance, type Vec2 } from '../../../lib/vectorMath'
import type {
  HeadToTailDrawSumQuestion as HeadToTailDrawSumQuestionType,
  HeadToTailDrawSumState,
} from '../../../types/lesson'
import { ColumnVector } from './ColumnVector'
import { HeadToTailDiagram } from './HeadToTailDiagram'
import { VectorComponentInput } from './VectorComponentInput'

const PLANE_MIN = -5
const PLANE_MAX = 5
const DRAG_MIN = -4
const DRAG_MAX = 4

interface HeadToTailDrawSumQuestionProps {
  question: HeadToTailDrawSumQuestionType
  state: HeadToTailDrawSumState
  onStateChange: (next: HeadToTailDrawSumState) => void
  disabled?: boolean
}

function snapInteger([x, y]: Vec2): Vec2 {
  return [
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(x))),
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(y))),
  ]
}

export function HeadToTailDrawSumQuestion({
  question,
  state,
  onStateChange,
  disabled = false,
}: HeadToTailDrawSumQuestionProps) {
  const { vectorA, vectorB } = state
  const tolerance = question.correctAnswer.tolerance
  const target = add(vectorA, vectorB)
  const drawnCorrect = equalsWithTolerance(state.sumTip, target, tolerance)

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

  const { svgRef, pointerHandlers } = useSvgPointer({
    bounds: { min: DRAG_MIN, max: DRAG_MAX },
    onDrag: handleSumDrag,
    enabled: !disabled,
  })

  return (
    <div className="head-to-tail-drawsum-question">
      <CoordinatePlane ref={svgRef} min={PLANE_MIN} max={PLANE_MAX}>
        <HeadToTailDiagram vectorA={vectorA} vectorB={vectorB} />
        <Vector
          tip={state.sumTip}
          color="var(--lesson-vector-sum)"
          label="a + b"
          draggable={!disabled}
          onHandlePointerDown={pointerHandlers.onPointerDown}
          onHandlePointerMove={pointerHandlers.onPointerMove}
          onHandlePointerUp={pointerHandlers.onPointerUp}
          onHandlePointerCancel={pointerHandlers.onPointerCancel}
        />
      </CoordinatePlane>

      {drawnCorrect ? (
        <>
          <p className="head-to-tail-drawsum-question__status">
            Correct — that's the a + b path! Now, what is a + b?
          </p>
          <div className="head-to-tail-drawsum-question__equation">
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
      ) : (
        !disabled && (
          <p className="head-to-tail-drawsum-question__help muted">
            Vectors a and b are connected head-to-tail. Drag the a + b vector from the origin to the
            end of the path.
          </p>
        )
      )}
    </div>
  )
}
