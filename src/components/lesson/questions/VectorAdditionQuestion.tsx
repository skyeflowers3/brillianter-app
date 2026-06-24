import { useCallback } from 'react'
import { CoordinatePlane } from '../../svg/CoordinatePlane'
import { Vector } from '../../svg/Vector'
import { useSvgPointer } from '../../../hooks/useSvgPointer'
import { presetVectorA, presetVectorB } from '../../../lib/headToTailSteps'
import type { Vec2 } from '../../../lib/vectorMath'
import type { HeadToTailAddQuestion, HeadToTailAddState } from '../../../types/lesson'
import { ColumnVector } from './ColumnVector'
import { FixedHeadToTailPair } from './FixedHeadToTailPair'
import { VectorComponentInput } from './VectorComponentInput'

const PLANE_MIN = -8
const PLANE_MAX = 8
const DRAG_MIN = -7
const DRAG_MAX = 7

interface VectorAdditionQuestionProps {
  question: HeadToTailAddQuestion
  state: HeadToTailAddState
  onStateChange: (next: HeadToTailAddState) => void
  disabled?: boolean
}

function snapInteger([x, y]: Vec2): Vec2 {
  return [
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(x))),
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(y))),
  ]
}

export function VectorAdditionQuestion({
  question,
  state,
  onStateChange,
  disabled = false,
}: VectorAdditionQuestionProps) {
  const fixedA = presetVectorA(question)
  const fixedB = presetVectorB(question)

  const syncSumTip = useCallback(
    (position: Vec2) => {
      onStateChange({
        ...state,
        step: 'drawSum',
        vectorA: fixedA,
        vectorB: fixedB,
        sumTip: snapInteger(position),
      })
    },
    [fixedA, fixedB, onStateChange, state],
  )

  const { svgRef, pointerHandlers } = useSvgPointer({
    bounds: { min: DRAG_MIN, max: DRAG_MAX },
    onDrag: syncSumTip,
    enabled: !disabled,
  })

  const handleInputChange = useCallback(
    (sumInput: Vec2) => {
      onStateChange({
        ...state,
        step: 'drawSum',
        vectorA: fixedA,
        vectorB: fixedB,
        sumInput,
      })
    },
    [fixedA, fixedB, onStateChange, state],
  )

  return (
    <div className="vector-addition-question">
      <CoordinatePlane ref={svgRef} min={PLANE_MIN} max={PLANE_MAX}>
        <FixedHeadToTailPair vectorA={fixedA} vectorB={fixedB} />
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
      <div className="vector-addition-question__equation">
        <ColumnVector value={fixedA} color="var(--lesson-vector-a)" label="vector a" />
        <span className="vector-equation__op" aria-hidden="true">+</span>
        <ColumnVector value={fixedB} color="var(--lesson-vector-b)" label="vector b" />
        <span className="vector-equation__op" aria-hidden="true">=</span>
        <VectorComponentInput
          name="a + b"
          value={state.sumInput}
          onChange={handleInputChange}
          disabled={disabled}
          color="var(--lesson-vector-sum)"
        />
      </div>
      {!disabled && (
        <p className="vector-addition-question__help muted">
          Vectors a and b are fixed. Draw a + b on the graph, then enter the sum in the equation above.
        </p>
      )}
    </div>
  )
}
