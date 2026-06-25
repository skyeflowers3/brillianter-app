import { useCallback } from 'react'
import { CoordinatePlane } from '../../svg/CoordinatePlane'
import { Vector } from '../../svg/Vector'
import { useSvgPointer } from '../../../hooks/useSvgPointer'
import type { Vec2 } from '../../../lib/vectorMath'

interface DrawVectorQuestionProps {
  tip: Vec2
  onTipChange: (tip: Vec2) => void
  disabled?: boolean
}

const PLANE_MIN = -8
const PLANE_MAX = 8
const DRAG_MIN = -7
const DRAG_MAX = 7

function snapInteger([x, y]: Vec2): Vec2 {
  return [
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(x))),
    Math.min(DRAG_MAX, Math.max(DRAG_MIN, Math.round(y))),
  ]
}

export function DrawVectorQuestion({ tip, onTipChange, disabled = false }: DrawVectorQuestionProps) {
  const handleDrag = useCallback(
    (position: Vec2) => {
      onTipChange(snapInteger(position))
    },
    [onTipChange],
  )

  const { svgRef, pointerHandlers } = useSvgPointer({
    bounds: { min: DRAG_MIN, max: DRAG_MAX },
    onDrag: handleDrag,
    enabled: !disabled,
    value: tip,
  })

  const setSvgRef = useCallback(
    (node: SVGSVGElement | null) => {
      svgRef.current = node
    },
    [svgRef],
  )

  return (
    <div className="draw-vector-question">
      <CoordinatePlane ref={setSvgRef} min={PLANE_MIN} max={PLANE_MAX}>
        <Vector
          tip={tip}
          draggable={!disabled}
          onHandlePointerDown={pointerHandlers.onPointerDown}
          onHandlePointerMove={pointerHandlers.onPointerMove}
          onHandlePointerUp={pointerHandlers.onPointerUp}
          onHandlePointerCancel={pointerHandlers.onPointerCancel}
        />
      </CoordinatePlane>
      {!disabled && (
        <p className="draw-vector-question__help muted">
          Drag the purple point to set the vector tip.
        </p>
      )}
    </div>
  )
}
