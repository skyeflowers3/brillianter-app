import { useCallback, useState } from 'react'
import { CoordinatePlane } from '../../svg/CoordinatePlane'
import { Vector } from '../../svg/Vector'
import { useSvgPointer } from '../../../hooks/useSvgPointer'
import { mathToSvg } from '../../../lib/svgMath'
import { formatScalar, scalarFromPoint, scaledVector, snapScalar } from '../../../lib/scalarMultiply'
import type { Vec2 } from '../../../lib/vectorMath'
import type {
  MultipleChoiceExplorer,
  MultipleChoiceQuestion,
  MultipleChoiceState,
} from '../../../types/lesson'

interface MultipleChoiceQuestionProps {
  question: MultipleChoiceQuestion
  state: MultipleChoiceState
  onStateChange: (next: MultipleChoiceState) => void
  disabled?: boolean
}

/** Pull the two numbers out of an option label like "⟨6, 4⟩" or "⟨−3, −2⟩". */
function parseVectorLabel(label: string): Vec2 | null {
  const nums = label.replace(/\u2212/g, '-').match(/-?\d+(?:\.\d+)?/g)
  if (!nums || nums.length < 2) {
    return null
  }
  return [Number(nums[0]), Number(nums[1])]
}

interface ExplorerPlaneProps {
  explorer: MultipleChoiceExplorer
  points: { id: string; label: string; vec: Vec2 }[]
  disabled: boolean
}

function ExplorerPlane({ explorer, points, disabled }: ExplorerPlaneProps) {
  const min = explorer.min ?? -8
  const max = explorer.max ?? 8
  const sliderConfig = { min: -5, max: 5, step: 0.25 }
  const [scalar, setScalar] = useState(1)
  const scaled = scaledVector(explorer.baseVector, scalar)

  const handleHeadDrag = useCallback(
    (position: Vec2) => {
      setScalar(snapScalar(scalarFromPoint(explorer.baseVector, position), sliderConfig))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [explorer.baseVector],
  )

  const { svgRef, pointerHandlers } = useSvgPointer({
    bounds: { min, max },
    onDrag: handleHeadDrag,
    enabled: !disabled,
  })

  return (
    <CoordinatePlane ref={svgRef} min={min} max={max}>
      {points.map((point) => {
        const [cx, cy] = mathToSvg(point.vec)
        // Anchor the label to the left of the dot when it sits near the right edge or has a close
        // neighbour to its right, so labels stay fully visible and don't collide.
        const placeLeft =
          point.vec[0] >= max - 2 ||
          points.some(
            (other) =>
              other.id !== point.id &&
              Math.abs(other.vec[1] - point.vec[1]) < 0.5 &&
              other.vec[0] > point.vec[0] &&
              other.vec[0] - point.vec[0] <= 2,
          )
        return (
          <g key={point.id} className="mc-explorer__point">
            <circle cx={cx} cy={cy} r={0.18} className="mc-explorer__point-dot" />
            <text
              x={cx + (placeLeft ? -0.35 : 0.35)}
              y={cy - 0.35}
              textAnchor={placeLeft ? 'end' : 'start'}
              className="coordinate-plane__grid-number"
            >
              {point.label}
            </text>
          </g>
        )
      })}
      <Vector
        tip={explorer.baseVector}
        color="var(--lesson-vector-a)"
        label="A"
        labelOffset={[0, 1.5]}
        dashed
      />
      <Vector
        tip={scaled}
        color="var(--lesson-vector-sum)"
        label={`c = ${formatScalar(scalar)}`}
        draggable={!disabled}
        onHandlePointerDown={pointerHandlers.onPointerDown}
        onHandlePointerMove={pointerHandlers.onPointerMove}
        onHandlePointerUp={pointerHandlers.onPointerUp}
        onHandlePointerCancel={pointerHandlers.onPointerCancel}
      />
    </CoordinatePlane>
  )
}

export function MultipleChoiceQuestion({
  question,
  state,
  onStateChange,
  disabled = false,
}: MultipleChoiceQuestionProps) {
  const toggle = useCallback(
    (optionId: string) => {
      const selected = state.selected.includes(optionId)
        ? state.selected.filter((id) => id !== optionId)
        : [...state.selected, optionId]
      onStateChange({ type: 'multipleChoice', selected })
    },
    [onStateChange, state.selected],
  )

  const explorerPoints = question.explorer
    ? question.options
        .map((option) => {
          const vec = parseVectorLabel(option.label)
          return vec ? { id: option.id, label: option.label, vec } : null
        })
        .filter((point): point is { id: string; label: string; vec: Vec2 } => point !== null)
    : []

  return (
    <div className="multiple-choice-question">
      {question.referenceLabel && (
        <p className="multiple-choice-question__reference">{question.referenceLabel}</p>
      )}

      {question.explorer && (
        <ExplorerPlane explorer={question.explorer} points={explorerPoints} disabled={disabled} />
      )}

      <ul className="multiple-choice-question__options" role="group">
        {question.options.map((option) => {
          const checked = state.selected.includes(option.id)
          return (
            <li key={option.id}>
              <button
                type="button"
                className={`multiple-choice-option${checked ? ' is-selected' : ''}`}
                aria-pressed={checked}
                disabled={disabled}
                onClick={() => toggle(option.id)}
              >
                <span className="multiple-choice-option__marker" aria-hidden="true" />
                <span className="multiple-choice-option__label">{option.label}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {!disabled && (
        <p className="multiple-choice-question__help muted">
          {question.explorer
            ? "Drag the head of vector A to scale it. A point is a scalar multiple of A only if the scaled vector can land exactly on it."
            : 'Select every vector that is a scalar multiple of A.'}
        </p>
      )}
    </div>
  )
}
