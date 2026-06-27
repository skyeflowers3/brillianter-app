import { Vector } from '../svg/Vector'
import { mathToSvg } from '../../lib/svgMath'
import type { Vec2 } from '../../lib/vectorMath'
import { SteppedIntroFigure, type IntroStep } from './SteppedIntroFigure'

interface VectorIntroFigureProps {
  vector: Vec2
}

/** A handful of vectors in different directions, to show "a vector is movement" before specifics. */
const EXAMPLE_VECTORS: { tip: Vec2; color: string }[] = [
  { tip: [3, 2], color: 'var(--lesson-vector-a)' },
  { tip: [-3, 2], color: 'var(--lesson-vector-b)' },
  { tip: [2, -3], color: 'var(--lesson-vector-sum)' },
]

/**
 * Looping intro animation for "what is a vector". First it conveys the idea — a vector is movement,
 * shown with a few example arrows pointing different ways — then it zooms in on one example, ⟨3, 2⟩,
 * and breaks its movement down: move right → move up → that's the vector.
 */
export function VectorIntroFigure({ vector }: VectorIntroFigureProps) {
  const [x, y] = vector
  const [originX, originY] = mathToSvg([0, 0])
  const [cornerX, cornerY] = mathToSvg([x, 0])
  const [tipX, tipY] = mathToSvg(vector)
  const [hLabelX, hLabelY] = mathToSvg([x / 2, 0])
  const [vLabelX, vLabelY] = mathToSvg([x, y / 2])
  const hLen = Math.abs(x)
  const vLen = Math.abs(y)

  const examples = (
    <>
      {EXAMPLE_VECTORS.map((example) => (
        <Vector key={`${example.tip[0]},${example.tip[1]}`} tip={example.tip} color={example.color} />
      ))}
    </>
  )

  const horizontal = (
    <>
      <line
        x1={originX}
        y1={originY}
        x2={cornerX}
        y2={cornerY}
        className="movement-path movement-path--h"
        style={{ strokeDasharray: hLen, strokeDashoffset: hLen }}
      />
      <text x={hLabelX} y={hLabelY + 0.7} textAnchor="middle" className="movement-label">
        {hLen} right
      </text>
    </>
  )

  const vertical = (
    <>
      <line
        x1={cornerX}
        y1={cornerY}
        x2={tipX}
        y2={tipY}
        className="movement-path movement-path--v"
        style={{ strokeDasharray: vLen, strokeDashoffset: vLen }}
      />
      <text
        x={vLabelX - 0.5}
        y={vLabelY}
        textAnchor="end"
        dominantBaseline="middle"
        className="movement-label"
      >
        {vLen} up
      </text>
    </>
  )

  const steps: IntroStep[] = [
    {
      caption: 'A vector represents movement',
      content: examples,
    },
    {
      caption: 'It shows how far left or right and up or down a path goes',
      content: examples,
    },
    {
      caption: `Let's look at an example: ⟨${x}, ${y}⟩`,
      content: <Vector tip={vector} color="var(--lesson-vector-a)" label={`⟨${x}, ${y}⟩`} />,
    },
    {
      caption: `Move ${hLen} units right`,
      content: horizontal,
    },
    {
      caption: `Then move ${vLen} units up`,
      content: (
        <>
          {horizontal}
          {vertical}
        </>
      ),
    },
    {
      caption: `That's the vector ⟨${x}, ${y}⟩`,
      content: <Vector tip={vector} color="var(--lesson-vector-a)" label={`⟨${x}, ${y}⟩`} />,
    },
  ]

  return (
    <SteppedIntroFigure steps={steps} planeMin={-4} planeMax={4} className="stepped-intro--compact" />
  )
}
