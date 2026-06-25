import { CoordinatePlane } from '../svg/CoordinatePlane'
import { Vector } from '../svg/Vector'
import { mathToSvg } from '../../lib/svgMath'
import type { LessonInterstitialFigure } from '../../types/lesson'

const ARC_RADIUS = 1.1

/**
 * Diagram for the "direction and magnitude" teaching page: the vector with an angle arc measured
 * from the positive x-axis and a magnitude label along the vector.
 */
export function DirectionMagnitudeFigure({ vector, angleLabel, magnitudeLabel }: LessonInterstitialFigure) {
  const theta = Math.atan2(vector[1], vector[0])
  const [arcStartX, arcStartY] = mathToSvg([ARC_RADIUS, 0])
  const [arcEndX, arcEndY] = mathToSvg([ARC_RADIUS * Math.cos(theta), ARC_RADIUS * Math.sin(theta)])
  const arcPath = `M ${arcStartX} ${arcStartY} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 0 ${arcEndX} ${arcEndY}`
  const [angleLabelX, angleLabelY] = mathToSvg([
    1.7 * Math.cos(theta / 2),
    1.7 * Math.sin(theta / 2),
  ])
  // Offset the magnitude label perpendicular to the vector, on the opposite side from the angle
  // arc (which sits between the +x axis and the vector), so the two labels never overlap.
  const MAG_GAP = 0.7
  const perp: [number, number] = [-Math.sin(theta), Math.cos(theta)]
  const [magLabelX, magLabelY] = mathToSvg([
    vector[0] / 2 + perp[0] * MAG_GAP,
    vector[1] / 2 + perp[1] * MAG_GAP,
  ])
  const magAnchor = perp[0] < -0.001 ? 'end' : perp[0] > 0.001 ? 'start' : 'middle'

  return (
    <div className="lesson-interstitial__figure">
      <CoordinatePlane min={-4} max={4}>
        {angleLabel && (
          <>
            <path d={arcPath} className="figure-angle-arc" fill="none" />
            <text
              x={angleLabelX}
              y={angleLabelY}
              textAnchor="middle"
              dominantBaseline="middle"
              className="figure-angle-label"
            >
              {angleLabel}
            </text>
          </>
        )}
        <Vector tip={vector} color="var(--lesson-vector-a)" />
        {magnitudeLabel && (
          <text
            x={magLabelX}
            y={magLabelY}
            textAnchor={magAnchor}
            dominantBaseline="middle"
            className="figure-magnitude-label"
          >
            {magnitudeLabel}
          </text>
        )}
      </CoordinatePlane>
    </div>
  )
}
