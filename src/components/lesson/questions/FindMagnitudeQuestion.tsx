import { useCallback } from 'react'
import { CoordinatePlane } from '../../svg/CoordinatePlane'
import { Vector } from '../../svg/Vector'
import { mathToSvg } from '../../../lib/svgMath'
import type {
  FindMagnitudeQuestion as FindMagnitudeQuestionType,
  FindMagnitudeState,
} from '../../../types/lesson'
import { ScalarValueInput } from './ScalarValueInput'

const PLANE_MIN = -2
const PLANE_MAX = 8

interface FindMagnitudeQuestionProps {
  question: FindMagnitudeQuestionType
  state: FindMagnitudeState
  onStateChange: (next: FindMagnitudeState) => void
  disabled?: boolean
}

export function FindMagnitudeQuestion({
  question,
  state,
  onStateChange,
  disabled = false,
}: FindMagnitudeQuestionProps) {
  const v = question.correctAnswer.vector
  const [originX, originY] = mathToSvg([0, 0])
  const [cornerX, cornerY] = mathToSvg([v[0], 0])
  const [tipX, tipY] = mathToSvg(v)
  const [hLabelX, hLabelY] = mathToSvg([v[0] / 2, 0])
  const [vLabelX, vLabelY] = mathToSvg([v[0], v[1] / 2])

  const handleMagnitude = useCallback(
    (magnitudeInput: number) => {
      onStateChange({ type: 'findMagnitude', magnitudeInput })
    },
    [onStateChange],
  )

  return (
    <div className="find-magnitude-question">
      <CoordinatePlane min={PLANE_MIN} max={PLANE_MAX}>
        <line
          x1={originX}
          y1={originY}
          x2={cornerX}
          y2={cornerY}
          className="find-magnitude__leg"
        />
        <line x1={cornerX} y1={cornerY} x2={tipX} y2={tipY} className="find-magnitude__leg" />
        <text
          x={hLabelX}
          y={hLabelY + 0.7}
          textAnchor="middle"
          className="find-magnitude__leg-label"
        >
          {Math.abs(v[0])}
        </text>
        <text
          x={vLabelX + 0.4}
          y={vLabelY}
          dominantBaseline="middle"
          className="find-magnitude__leg-label"
        >
          {Math.abs(v[1])}
        </text>
        <Vector tip={v} color="var(--lesson-vector-a)" />
      </CoordinatePlane>

      <div className="find-magnitude-question__answer">
        <ScalarValueInput
          label="magnitude ="
          ariaLabel="magnitude"
          value={state.magnitudeInput}
          onChange={handleMagnitude}
          disabled={disabled}
          color="var(--lesson-vector-a)"
        />
      </div>

      {!disabled && (
        <p className="find-magnitude-question__help muted">
          Use the right triangle: the legs are {Math.abs(v[0])} and {Math.abs(v[1])}. How long is the
          vector?
        </p>
      )}
    </div>
  )
}
