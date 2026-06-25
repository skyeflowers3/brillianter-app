import { useCallback, useEffect, useRef } from 'react'
import { CoordinatePlane } from '../../svg/CoordinatePlane'
import { Vector } from '../../svg/Vector'
import { useSvgPointer } from '../../../hooks/useSvgPointer'
import { formatScalar, scalarFromPoint, snapScalar } from '../../../lib/scalarMultiply'
import {
  comboTargetIndex,
  comboTargets,
  comboVectors,
  isLinearComboOnTarget,
} from '../../../lib/validation'
import { add, scale, type Vec2 } from '../../../lib/vectorMath'
import { lineThroughOriginEndpoints, mathToSvg } from '../../../lib/svgMath'
import type {
  LinearComboCoefficientConfig,
  LinearComboQuestion as LinearComboQuestionType,
  LinearComboState,
} from '../../../types/lesson'

const DEFAULT_COEFFICIENT: LinearComboCoefficientConfig = { min: -4, max: 4, step: 0.5 }
const VECTOR_COLORS = ['var(--lesson-vector-a)', 'var(--lesson-vector-b)']

interface LinearComboQuestionProps {
  question: LinearComboQuestionType
  state: LinearComboState
  onStateChange: (next: LinearComboState) => void
  disabled?: boolean
}

function formatPoint([x, y]: Vec2): string {
  return `⟨${formatScalar(x)}, ${formatScalar(y)}⟩`
}

function svgPoints(points: Vec2[]): string {
  return points.map((point) => mathToSvg(point).join(',')).join(' ')
}

export function LinearComboQuestion({
  question,
  state,
  onStateChange,
  disabled = false,
}: LinearComboQuestionProps) {
  const answer = question.correctAnswer
  const vectors = comboVectors(answer)
  const targets = comboTargets(answer)
  const planeMin = question.planeMin ?? -6
  const planeMax = question.planeMax ?? 6
  const config = question.coefficient ?? DEFAULT_COEFFICIENT
  const isReachable = question.mode === 'reachable'
  const twoVectors = vectors.length === 2

  const targetIndex = comboTargetIndex(answer, state)
  const currentTarget = targets[targetIndex]
  const onCurrentTarget = isLinearComboOnTarget(answer, state)
  const isLastTarget = targetIndex === targets.length - 1

  // Multi-target reach: once the learner lands on the current target, reveal the next one.
  useEffect(() => {
    if (disabled || isReachable || onCurrentTarget !== true || isLastTarget) {
      return
    }
    onStateChange({ ...state, targetIndex: targetIndex + 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, isReachable, onCurrentTarget, isLastTarget, targetIndex])

  const scaledA = scale(answer.vectorA, state.coefficients[0] ?? 0)
  const scaledB = answer.vectorB ? scale(answer.vectorB, state.coefficients[1] ?? 0) : ([0, 0] as Vec2)
  const corner = add(scaledA, scaledB)

  const setCoefficient = useCallback(
    (index: number, value: number) => {
      const coefficients = state.coefficients.map((current, i) => (i === index ? value : current))
      onStateChange({ ...state, coefficients })
    },
    [onStateChange, state],
  )

  const handleDragA = useCallback(
    (position: Vec2) => {
      setCoefficient(0, snapScalar(scalarFromPoint(answer.vectorA, position), config))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setCoefficient, answer.vectorA, config.min, config.max, config.step],
  )

  const handleDragB = useCallback(
    (position: Vec2) => {
      if (!answer.vectorB) {
        return
      }
      setCoefficient(1, snapScalar(scalarFromPoint(answer.vectorB, position), config))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setCoefficient, answer.vectorB, config.min, config.max, config.step],
  )

  const handleVerdict = useCallback(
    (verdict: 'yes' | 'no') => {
      onStateChange({ ...state, reachableInput: verdict })
    },
    [onStateChange, state],
  )

  const svgRef = useRef<SVGSVGElement>(null)

  const pointerA = useSvgPointer({
    bounds: { min: planeMin, max: planeMax },
    onDrag: handleDragA,
    enabled: !disabled,
    svgRef,
    value: scaledA,
  })

  const pointerB = useSvgPointer({
    bounds: { min: planeMin, max: planeMax },
    onDrag: handleDragB,
    enabled: !disabled && twoVectors,
    svgRef,
    value: scaledB,
  })

  const [cornerX, cornerY] = mathToSvg(corner)
  const [targetX, targetY] = mathToSvg(currentTarget)
  const regionLine =
    question.region === 'line' ? lineThroughOriginEndpoints(vectors[0], planeMin, planeMax) : null

  const reachedCount = isReachable ? 0 : targetIndex + (onCurrentTarget && isLastTarget ? 1 : 0)

  return (
    <div className="linear-combo-question">
      {question.referenceLabel && (
        <p className="linear-combo-question__reference">{question.referenceLabel}</p>
      )}

      <CoordinatePlane ref={svgRef} min={planeMin} max={planeMax}>
        {/* Reachable-region overlay (a hint, not the answer). */}
        {question.region === 'plane' && (
          <rect
            x={planeMin}
            y={-planeMax}
            width={planeMax - planeMin}
            height={planeMax - planeMin}
            className="linear-combo__region-plane"
          />
        )}
        {regionLine && (
          <line
            x1={mathToSvg(regionLine[0])[0]}
            y1={mathToSvg(regionLine[0])[1]}
            x2={mathToSvg(regionLine[1])[0]}
            y2={mathToSvg(regionLine[1])[1]}
            className="linear-combo__region-line"
          />
        )}

        {/* The parallelogram spanned by the two scaled vectors. */}
        {twoVectors && (
          <g className="linear-combo__parallelogram" aria-hidden="true">
            <polygon
              points={svgPoints([[0, 0], scaledA, corner, scaledB])}
              className="linear-combo__parallelogram-fill"
            />
            {/* Translated edges (parallel copies of A and B) — dashed, no arrowheads. */}
            <line
              x1={mathToSvg(scaledA)[0]}
              y1={mathToSvg(scaledA)[1]}
              x2={cornerX}
              y2={cornerY}
              className="linear-combo__parallelogram-edge"
            />
            <line
              x1={mathToSvg(scaledB)[0]}
              y1={mathToSvg(scaledB)[1]}
              x2={cornerX}
              y2={cornerY}
              className="linear-combo__parallelogram-edge"
            />
          </g>
        )}

        {/* The fixed target point, labelled with its coordinates. */}
        <g className="linear-combo__target">
          <circle cx={targetX} cy={targetY} r={0.42} className="linear-combo__target-ring" />
          <circle cx={targetX} cy={targetY} r={0.12} className="linear-combo__target-dot" />
          <text
            x={targetX + 0.55}
            y={targetY - 0.55}
            className="linear-combo__target-label"
            textAnchor="start"
          >
            {formatPoint(currentTarget)}
          </text>
        </g>

        {/* Scaled A — drag its head to change c (stays on A's line). */}
        <Vector
          tip={scaledA}
          color={VECTOR_COLORS[0]}
          label={`c = ${formatScalar(state.coefficients[0] ?? 0)}`}
          labelOffset={[0, 0.9]}
          draggable={!disabled}
          onHandlePointerDown={pointerA.pointerHandlers.onPointerDown}
          onHandlePointerMove={pointerA.pointerHandlers.onPointerMove}
          onHandlePointerUp={pointerA.pointerHandlers.onPointerUp}
          onHandlePointerCancel={pointerA.pointerHandlers.onPointerCancel}
        />

        {/* Scaled B — drag its head to change d (stays on B's line). */}
        {twoVectors && (
          <Vector
            tip={scaledB}
            color={VECTOR_COLORS[1]}
            label={`d = ${formatScalar(state.coefficients[1] ?? 0)}`}
            labelOffset={[0, 0.9]}
            draggable={!disabled}
            onHandlePointerDown={pointerB.pointerHandlers.onPointerDown}
            onHandlePointerMove={pointerB.pointerHandlers.onPointerMove}
            onHandlePointerUp={pointerB.pointerHandlers.onPointerUp}
            onHandlePointerCancel={pointerB.pointerHandlers.onPointerCancel}
          />
        )}

        {/* The combined corner cA + dB — the point that must land on the target. */}
        {twoVectors && (
          <g className="linear-combo__corner">
            <circle
              cx={cornerX}
              cy={cornerY}
              r={0.26}
              className={`linear-combo__corner-dot${onCurrentTarget ? ' is-on-target' : ''}`}
            />
            {!onCurrentTarget && (
              <text
                x={cornerX + 0.5}
                y={cornerY + 0.95}
                className="linear-combo__corner-label"
                textAnchor="start"
              >
                cA + dB
              </text>
            )}
          </g>
        )}
      </CoordinatePlane>

      {isReachable ? (
        <div className="linear-combo__verdict" role="group" aria-label="Is the point reachable?">
          <button
            type="button"
            className={`linear-combo__verdict-btn${state.reachableInput === 'yes' ? ' is-selected' : ''}`}
            aria-pressed={state.reachableInput === 'yes'}
            disabled={disabled}
            onClick={() => handleVerdict('yes')}
          >
            Yes, it can be reached
          </button>
          <button
            type="button"
            className={`linear-combo__verdict-btn${state.reachableInput === 'no' ? ' is-selected' : ''}`}
            aria-pressed={state.reachableInput === 'no'}
            disabled={disabled}
            onClick={() => handleVerdict('no')}
          >
            No, it cannot be reached
          </button>
        </div>
      ) : null}

      {!disabled && (
        <p
          className={`linear-combo-question__status${onCurrentTarget && !isReachable ? ' is-success' : ''}`}
        >
          {isReachable
            ? twoVectors
              ? 'Drag the heads of A and B to scale them. Can the parallelogram’s corner ever reach the point?'
              : 'Drag the head of A along its line. Can it ever land on the point?'
            : twoVectors
              ? targets.length > 1
                ? onCurrentTarget && isLastTarget
                  ? `On the point! That makes ${reachedCount} — submit when ready.`
                  : `Drag the heads of A and B so the corner reaches the point. (${reachedCount} of ${targets.length} reached)`
                : onCurrentTarget
                  ? 'The corner is on the point! Submit when ready.'
                  : 'Drag the heads of A and B so the parallelogram’s corner reaches the point.'
              : onCurrentTarget
                ? 'On the point! Submit when ready.'
                : 'Drag the head of A until it lands on the point.'}
        </p>
      )}
    </div>
  )
}
