import { CoordinatePlane } from '../svg/CoordinatePlane'
import { Vector } from '../svg/Vector'
import { mathToSvg } from '../../lib/svgMath'
import type { Vec2 } from '../../lib/vectorMath'

interface MovementFigureProps {
  /** Destination point; the path goes right then up from the origin to here. */
  destination: Vec2
}

/**
 * Animated "movement" example for the intro: the path draws the horizontal move first, then the
 * vertical move, ending at `destination`, alongside the resulting vector.
 */
export function MovementFigure({ destination }: MovementFigureProps) {
  const [x, y] = destination
  const [originX, originY] = mathToSvg([0, 0])
  const [cornerX, cornerY] = mathToSvg([x, 0])
  const [tipX, tipY] = mathToSvg(destination)
  const [hLabelX, hLabelY] = mathToSvg([x / 2, 0])
  const [vLabelX, vLabelY] = mathToSvg([x, y / 2])
  // Vector label sits above the arrow, clear of the line and the "right"/"up" annotations.
  const [vecLabelX, vecLabelY] = mathToSvg([x / 2 - 0.3, y / 2 + 1.3])
  const hLen = Math.abs(x)
  const vLen = Math.abs(y)

  return (
    <div className="lesson-intro__figure">
      <CoordinatePlane min={-1} max={Math.max(x, y) + 2}>
        <line
          x1={originX}
          y1={originY}
          x2={cornerX}
          y2={cornerY}
          className="movement-path movement-path--h"
          style={{ strokeDasharray: hLen, strokeDashoffset: hLen }}
        />
        <line
          x1={cornerX}
          y1={cornerY}
          x2={tipX}
          y2={tipY}
          className="movement-path movement-path--v"
          style={{ strokeDasharray: vLen, strokeDashoffset: vLen }}
        />
        <text x={hLabelX} y={hLabelY + 0.7} textAnchor="middle" className="movement-label">
          {hLen} right
        </text>
        <text x={vLabelX + 0.5} y={vLabelY} dominantBaseline="middle" className="movement-label">
          {vLen} up
        </text>
        <Vector tip={destination} color="var(--lesson-vector-a)" />
        <text
          x={vecLabelX}
          y={vecLabelY}
          textAnchor="middle"
          dominantBaseline="central"
          className="vector-label__text"
          style={{ fill: 'var(--lesson-vector-a)' }}
        >
          {`⟨${x}, ${y}⟩`}
        </text>
      </CoordinatePlane>
    </div>
  )
}
