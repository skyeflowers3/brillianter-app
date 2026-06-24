import { useId } from 'react'
import { mathToSvg } from '../../lib/svgMath'
import { add, type Vec2 } from '../../lib/vectorMath'
import { useVectorLabel } from './vectorLabelRegistry'

interface VectorProps {
  tip: Vec2
  origin?: Vec2
  color?: string
  draggable?: boolean
  dashed?: boolean
  label?: string
  /** Manual nudge for the label, in grid units (x right, y up). */
  labelOffset?: Vec2
  showMarker?: boolean
  onHandlePointerDown?: (event: React.PointerEvent<SVGCircleElement>) => void
  onHandlePointerMove?: (event: React.PointerEvent<SVGCircleElement>) => void
  onHandlePointerUp?: (event: React.PointerEvent<SVGCircleElement>) => void
  onHandlePointerCancel?: (event: React.PointerEvent<SVGCircleElement>) => void
}

const HANDLE_RADIUS = 0.35
const HIT_RADIUS = 0.55

export function Vector({
  tip,
  origin = [0, 0],
  color = 'var(--lesson-vector)',
  draggable = false,
  dashed = false,
  label,
  labelOffset,
  showMarker = true,
  onHandlePointerDown,
  onHandlePointerMove,
  onHandlePointerUp,
  onHandlePointerCancel,
}: VectorProps) {
  const end = add(origin, tip)
  const [originX, originY] = mathToSvg(origin)
  const [tipX, tipY] = mathToSvg(end)
  const labelId = useId()

  // Labels are positioned by the plane's label layer so they avoid each other and arrowheads.
  // A manual offset (grid units, y-up) is converted to SVG units (y-down) for a final nudge.
  useVectorLabel(
    labelId,
    label,
    color,
    originX,
    originY,
    tipX,
    tipY,
    labelOffset ? labelOffset[0] : 0,
    labelOffset ? -labelOffset[1] : 0,
  )

  const dragHandlers = draggable
    ? {
        onPointerDown: onHandlePointerDown,
        onPointerMove: onHandlePointerMove,
        onPointerUp: onHandlePointerUp,
        onPointerCancel: onHandlePointerCancel,
      }
    : {}

  return (
    <g className="vector">
      <line
        x1={originX}
        y1={originY}
        x2={tipX}
        y2={tipY}
        className={`vector__shaft${dashed ? ' vector__shaft--dashed' : ''}`}
        style={{ stroke: color }}
        markerEnd={showMarker ? 'url(#vector-arrow-open)' : undefined}
      />
      {draggable && (
        <>
          <circle
            cx={tipX}
            cy={tipY}
            r={HANDLE_RADIUS}
            className="vector__handle"
            style={{ fill: color }}
            pointerEvents="all"
            {...dragHandlers}
          />
          <circle
            cx={tipX}
            cy={tipY}
            r={HIT_RADIUS}
            className="vector__hit-target"
            pointerEvents="all"
            {...dragHandlers}
          />
        </>
      )}
    </g>
  )
}
