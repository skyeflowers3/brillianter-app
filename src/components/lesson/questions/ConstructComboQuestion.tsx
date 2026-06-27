import { useCallback, useRef } from 'react'
import { CoordinatePlane } from '../../svg/CoordinatePlane'
import { PointLabel } from '../../svg/PointLabel'
import { Vector } from '../../svg/Vector'
import { useSvgPointer } from '../../../hooks/useSvgPointer'
import { formatScalar, scalarFromPoint, snapScalar } from '../../../lib/scalarMultiply'
import {
  constructTarget,
  isConstructConnected,
  isConstructScaledA,
  isConstructScaledB,
} from '../../../lib/validation'
import { add, equalsWithTolerance, scale, type Vec2 } from '../../../lib/vectorMath'
import { mathToSvg } from '../../../lib/svgMath'
import type {
  ConstructComboQuestion as ConstructComboQuestionType,
  ConstructComboState,
  LinearComboCoefficientConfig,
} from '../../../types/lesson'
import { ColumnVector } from './ColumnVector'
import { ScalarValueInput } from './ScalarValueInput'
import { VectorComponentInput } from './VectorComponentInput'

const DEFAULT_PLANE_MIN = -8
const DEFAULT_PLANE_MAX = 8
const DEFAULT_COEFFICIENT: LinearComboCoefficientConfig = { min: -4, max: 4, step: 1 }

interface ConstructComboQuestionProps {
  question: ConstructComboQuestionType
  state: ConstructComboState
  onStateChange: (next: ConstructComboState) => void
  disabled?: boolean
}

function formatPoint([x, y]: Vec2): string {
  return `⟨${formatScalar(x)}, ${formatScalar(y)}⟩`
}

/** Label a scaled base vector, e.g. 2 -> "2A", 1 -> "A", -1 -> "−A". */
function scaledLabel(scalar: number, name: string): string {
  if (Math.abs(scalar - 1) < 0.001) return name
  if (Math.abs(scalar + 1) < 0.001) return `−${name}`
  return `${formatScalar(scalar)}${name}`
}

/** Leading coefficient text for the first term, e.g. 1 -> "", -1 -> "−", -2 -> "−2", 2 -> "2". */
function coefLead(coef: number): string {
  if (coef === 1) return ''
  if (coef === -1) return '−'
  if (coef < 0) return `−${Math.abs(coef)}`
  return String(coef)
}

/** Magnitude text for a following term (its sign is shown by the operator), 1 -> "", 3 -> "3". */
function coefMagnitude(coef: number): string {
  return Math.abs(coef) === 1 ? '' : String(Math.abs(coef))
}

export function ConstructComboQuestion({
  question,
  state,
  onStateChange,
  disabled = false,
}: ConstructComboQuestionProps) {
  const answer = question.correctAnswer
  const { tolerance } = answer
  const { vectorA, vectorB } = state
  const planeMin = question.planeMin ?? DEFAULT_PLANE_MIN
  const planeMax = question.planeMax ?? DEFAULT_PLANE_MAX
  const config = question.coefficient ?? DEFAULT_COEFFICIENT

  const isRecognize = question.mode === 'recognize'
  const isFindScalars = question.mode === 'findScalars'
  const isConstruct = question.mode === 'construct'
  const gated = isConstruct && question.gated === true
  const showTarget = isRecognize || isFindScalars

  const scaledA = scale(vectorA, state.aScale)
  const scaledBDisp = scale(vectorB, state.bScale)
  const bHead = add(state.bTail, scaledBDisp)
  const comboEndpoint = add(scaledA, scaledBDisp)
  // Has the learner moved B's tail away from the origin yet?
  const bMoved = state.bTail[0] !== 0 || state.bTail[1] !== 0

  const scaledAOk = isConstructScaledA(answer, state)
  const scaledBOk = isConstructScaledB(answer, state)
  const connectedOk = isConstructConnected(answer, state)
  const drawnOk = equalsWithTolerance(state.resultTip, constructTarget(answer), tolerance)
  // For the free-build modes: B is connected head-to-tail to the current scaled A.
  const buildConnected = equalsWithTolerance(state.bTail, scaledA, tolerance)

  // Step gating. Guided construct unlocks one handle at a time in the order scale A → connect →
  // scale B → draw result. findScalars uses the same scale A → connect → scale B order, but
  // because the solution is unknown it gates on the *action* of connecting rather than on
  // correctness: A and the tail stay live, and B's head unlocks once it is connected head-to-tail.
  const aEnabled = !disabled && (gated ? !scaledAOk : true)
  const tailEnabled = !disabled && (gated ? scaledAOk && !connectedOk : true)
  const bHeadEnabled =
    !disabled &&
    (gated
      ? scaledAOk && connectedOk && !scaledBOk
      : isFindScalars
        ? buildConnected
        : true)
  const builtOk = scaledAOk && connectedOk && scaledBOk
  // Only construct mode draws a result vector. Guided waits until the path is built; ungated waits
  // until B has been moved off the origin so the green handle doesn't sit on top of B's tail.
  const showResult = isConstruct && (gated ? builtOk : bMoved)
  const resultEnabled = !disabled && showResult
  const showInput = isConstruct && (gated ? drawnOk : true)

  const snapInteger = useCallback(
    ([x, y]: Vec2): Vec2 => [
      Math.min(planeMax, Math.max(planeMin, Math.round(x))),
      Math.min(planeMax, Math.max(planeMin, Math.round(y))),
    ],
    [planeMin, planeMax],
  )

  const handleScaleA = useCallback(
    (position: Vec2) => {
      onStateChange({ ...state, aScale: snapScalar(scalarFromPoint(vectorA, position), config) })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onStateChange, state, vectorA, config.min, config.max, config.step],
  )

  const handleScaleB = useCallback(
    (position: Vec2) => {
      const relative: Vec2 = [position[0] - state.bTail[0], position[1] - state.bTail[1]]
      onStateChange({ ...state, bScale: snapScalar(scalarFromPoint(vectorB, relative), config) })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onStateChange, state, vectorB, config.min, config.max, config.step],
  )

  const handleTailDrag = useCallback(
    (position: Vec2) => {
      onStateChange({ ...state, bTail: snapInteger(position) })
    },
    [onStateChange, state, snapInteger],
  )

  const handleResultDrag = useCallback(
    (position: Vec2) => {
      onStateChange({ ...state, resultTip: snapInteger(position) })
    },
    [onStateChange, state, snapInteger],
  )

  const handleInput = useCallback(
    (resultInput: Vec2) => {
      onStateChange({ ...state, resultInput })
    },
    [onStateChange, state],
  )

  const handleCoefAInput = useCallback(
    (coefAInput: number) => {
      onStateChange({ ...state, coefAInput })
    },
    [onStateChange, state],
  )

  const handleCoefBInput = useCallback(
    (coefBInput: number) => {
      onStateChange({ ...state, coefBInput })
    },
    [onStateChange, state],
  )

  const handleVerdict = useCallback(
    (verdict: 'yes' | 'no') => {
      onStateChange({ ...state, reachableInput: verdict })
    },
    [onStateChange, state],
  )

  const svgRef = useRef<SVGSVGElement>(null)
  const bounds = { min: planeMin, max: planeMax }

  const aPointer = useSvgPointer({ bounds, onDrag: handleScaleA, enabled: aEnabled, svgRef, value: scaledA })
  const bHeadPointer = useSvgPointer({ bounds, onDrag: handleScaleB, enabled: bHeadEnabled, svgRef, value: bHead })
  const tailPointer = useSvgPointer({ bounds, onDrag: handleTailDrag, enabled: tailEnabled, svgRef, value: state.bTail })
  const resultPointer = useSvgPointer({ bounds, onDrag: handleResultDrag, enabled: resultEnabled, svgRef, value: state.resultTip })

  const [tailX, tailY] = mathToSvg(state.bTail)
  const [targetX, targetY] = mathToSvg(answer.target)
  const [comboX, comboY] = mathToSvg(comboEndpoint)

  const statusMessage = (() => {
    if (isRecognize) {
      return 'Scale and connect A and B to try to reach the highlighted point, then decide.'
    }
    if (isFindScalars) {
      if (!buildConnected) {
        return 'Scale A if you need to, then connect B head-to-tail: drag B’s tail to the head of A.'
      }
      return 'Now scale B until the path reaches the point, then fill in the scalars c and d below.'
    }
    if (!gated) {
      return 'You don’t have to move or draw the vectors — use the grid if it helps, then fill in the vector’s components below.'
    }
    if (!scaledAOk) return 'Scale A: drag the head of A until it is the right multiple.'
    if (!connectedOk) return 'Connect head-to-tail: drag B’s tail to the head of the scaled A.'
    if (!scaledBOk) return 'Scale B: drag the head of B until it is the right multiple.'
    if (!drawnOk) return 'Draw the result from the origin to the end of the path.'
    return 'Now fill in the vector’s components below.'
  })()

  return (
    <div className="construct-combo-question">
      {question.referenceLabel && <p className="question-reference">{question.referenceLabel}</p>}

      <CoordinatePlane ref={svgRef} min={planeMin} max={planeMax}>
        {/* Highlighted target (recognize / findScalars). Construct mode hides it so the learner solves it. */}
        {showTarget && (
          <g className="construct-combo__target">
            <circle cx={targetX} cy={targetY} r={0.42} className="linear-combo__target-ring" />
            <circle cx={targetX} cy={targetY} r={0.12} className="linear-combo__target-dot" />
            <PointLabel point={answer.target} text={formatPoint(answer.target)} color="var(--lesson-target)" />
          </g>
        )}

        {/* Scaled A from the origin. */}
        <Vector
          tip={scaledA}
          color="var(--lesson-vector-a)"
          label={scaledLabel(state.aScale, 'A')}
          draggable={aEnabled}
          onHandlePointerDown={aPointer.pointerHandlers.onPointerDown}
          onHandlePointerMove={aPointer.pointerHandlers.onPointerMove}
          onHandlePointerUp={aPointer.pointerHandlers.onPointerUp}
          onHandlePointerCancel={aPointer.pointerHandlers.onPointerCancel}
        />

        {/* Scaled B, drawn from its (draggable) tail. */}
        <Vector
          origin={state.bTail}
          tip={scaledBDisp}
          color="var(--lesson-vector-b)"
          label={scaledLabel(state.bScale, 'B')}
          draggable={bHeadEnabled}
          onHandlePointerDown={bHeadPointer.pointerHandlers.onPointerDown}
          onHandlePointerMove={bHeadPointer.pointerHandlers.onPointerMove}
          onHandlePointerUp={bHeadPointer.pointerHandlers.onPointerUp}
          onHandlePointerCancel={bHeadPointer.pointerHandlers.onPointerCancel}
        />

        {/* B's tail handle (connect head-to-tail). */}
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

        {/* The drawn result vector (construct mode). */}
        {showResult && (
          <Vector
            tip={state.resultTip}
            color="var(--lesson-vector-sum)"
            label={state.resultTip[0] !== 0 || state.resultTip[1] !== 0 ? question.expressionLabel : undefined}
            draggable={resultEnabled}
            onHandlePointerDown={resultPointer.pointerHandlers.onPointerDown}
            onHandlePointerMove={resultPointer.pointerHandlers.onPointerMove}
            onHandlePointerUp={resultPointer.pointerHandlers.onPointerUp}
            onHandlePointerCancel={resultPointer.pointerHandlers.onPointerCancel}
          />
        )}

        {/* Free-build modes: show the combination endpoint once B is connected head-to-tail.
            pointer-events are disabled so this overlay never steals drags from B's head handle. */}
        {showTarget && buildConnected && (
          <g className="construct-combo__combo" pointerEvents="none">
            <line x1={0} y1={0} x2={comboX} y2={comboY} className="construct-combo__result-line" />
            <circle
              cx={comboX}
              cy={comboY}
              r={0.26}
              className={`construct-combo__combo-dot${
                equalsWithTolerance(comboEndpoint, answer.target, tolerance) ? ' is-on-target' : ''
              }`}
            />
          </g>
        )}
      </CoordinatePlane>

      {!disabled && <p className="construct-combo-question__status">{statusMessage}</p>}

      {isRecognize && (
        <div className="linear-combo__verdict" role="group" aria-label="Is it a linear combination?">
          <button
            type="button"
            className={`linear-combo__verdict-btn${state.reachableInput === 'yes' ? ' is-selected' : ''}`}
            aria-pressed={state.reachableInput === 'yes'}
            disabled={disabled}
            onClick={() => handleVerdict('yes')}
          >
            Yes, it is a combination
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
      )}

      {isFindScalars && (
        <div className="construct-combo-question__equation">
          <ScalarValueInput
            label=""
            ariaLabel="scalar c"
            value={state.coefAInput}
            onChange={handleCoefAInput}
            disabled={disabled}
            color="var(--lesson-vector-a)"
          />
          <span className="vector-equation__op" aria-hidden="true">·</span>
          <ColumnVector value={vectorA} color="var(--lesson-vector-a)" label="vector A" />
          <span className="vector-equation__op" aria-hidden="true">+</span>
          <ScalarValueInput
            label=""
            ariaLabel="scalar d"
            value={state.coefBInput}
            onChange={handleCoefBInput}
            disabled={disabled}
            color="var(--lesson-vector-b)"
          />
          <span className="vector-equation__op" aria-hidden="true">·</span>
          <ColumnVector value={vectorB} color="var(--lesson-vector-b)" label="vector B" />
          <span className="vector-equation__op" aria-hidden="true">=</span>
          <ColumnVector value={answer.target} color="var(--lesson-target)" label="target" />
        </div>
      )}

      {showInput && (
        <div className="construct-combo-question__equation">
          {coefLead(answer.coefA) && (
            <span className="construct-combo-question__coef">{coefLead(answer.coefA)}</span>
          )}
          <ColumnVector value={vectorA} color="var(--lesson-vector-a)" label="vector A" />
          <span className="vector-equation__op" aria-hidden="true">
            {answer.coefB < 0 ? '−' : '+'}
          </span>
          {coefMagnitude(answer.coefB) && (
            <span className="construct-combo-question__coef">{coefMagnitude(answer.coefB)}</span>
          )}
          <ColumnVector value={vectorB} color="var(--lesson-vector-b)" label="vector B" />
          <span className="vector-equation__op" aria-hidden="true">
            =
          </span>
          <VectorComponentInput
            name={question.expressionLabel ?? 'result'}
            value={state.resultInput}
            onChange={handleInput}
            disabled={disabled}
            color="var(--lesson-vector-sum)"
          />
        </div>
      )}
    </div>
  )
}
