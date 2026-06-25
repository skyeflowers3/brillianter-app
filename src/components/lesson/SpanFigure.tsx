import { CoordinatePlane } from '../svg/CoordinatePlane'
import { Vector } from '../svg/Vector'
import { lineThroughOriginEndpoints, mathToSvg } from '../../lib/svgMath'
import { scale, type Vec2 } from '../../lib/vectorMath'

const VECTOR_COLORS = ['var(--lesson-vector-a)', 'var(--lesson-vector-b)']
const VECTOR_LABELS = ['A', 'B']

interface SpanFigureProps {
  vectors: Vec2[]
  min?: number
  max?: number
}

export function SpanFigure({ vectors, min = -6, max = 6 }: SpanFigureProps) {
  const direction = vectors[0] ?? [1, 0]
  const [lineStart, lineEnd] = lineThroughOriginEndpoints(direction, min, max)
  const [x1, y1] = mathToSvg(lineStart)
  const [x2, y2] = mathToSvg(lineEnd)

  // A few scaled copies along the line to suggest reachable points.
  const sampleScales = [-2, -1, 2, 3]

  return (
    <div className="span-figure">
      <CoordinatePlane min={min} max={max}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} className="span-figure__line" />

        {sampleScales.map((factor) => {
          const [cx, cy] = mathToSvg(scale(direction, factor))
          return <circle key={factor} cx={cx} cy={cy} r={0.16} className="span-figure__sample" />
        })}

        {vectors.map((vector, index) => (
          <Vector
            key={index}
            tip={vector}
            color={VECTOR_COLORS[index] ?? 'var(--lesson-vector-sum)'}
            label={VECTOR_LABELS[index] ?? undefined}
            labelOffset={[0, 1.1]}
          />
        ))}
      </CoordinatePlane>
    </div>
  )
}
