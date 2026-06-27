import { CoordinatePlane } from '../svg/CoordinatePlane'
import { Vector } from '../svg/Vector'
import type { TutorDiagram as TutorDiagramSpec, TutorDiagramColor } from '../../services/ai/types'

const COLOR_VARS: Record<TutorDiagramColor, string> = {
  a: 'var(--lesson-vector-a)',
  b: 'var(--lesson-vector-b)',
  sum: 'var(--lesson-vector-sum)',
  muted: '#94a3b8',
}

const MIN_BOUND = 4
const MAX_BOUND = 12

function requestedBound(diagram: TutorDiagramSpec): number {
  const value = diagram.planeMax ?? diagram.planeMin
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }
  return Math.round(Math.abs(value))
}

/**
 * Pick a plane size that actually contains every vector (tip and origin) with a unit of padding, so
 * the model's `planeMax` can never leave an arrow hanging off the edge of the grid. Falls back to the
 * requested size and stays within a sane range.
 */
function fitBound(diagram: TutorDiagramSpec, vectors: TutorDiagramSpec['vectors']): number {
  let maxCoord = 0
  for (const v of vectors) {
    const origin = Array.isArray(v.origin) && v.origin.length === 2 ? v.origin : [0, 0]
    maxCoord = Math.max(
      maxCoord,
      Math.abs(v.tip[0]),
      Math.abs(v.tip[1]),
      Math.abs(origin[0]),
      Math.abs(origin[1]),
    )
  }
  // +1 so the arrowhead sits inside the grid rather than on the very edge.
  const needed = Math.ceil(maxCoord) + 1
  return Math.min(MAX_BOUND, Math.max(MIN_BOUND, needed, requestedBound(diagram)))
}

/**
 * Renders a tutor-provided figure with the same coordinate-plane + vector components the lessons use.
 * Defensive by design: anything malformed is simply skipped so the chat can never crash on a bad
 * diagram from the model.
 */
export function TutorDiagram({ diagram }: { diagram: TutorDiagramSpec }) {
  const vectors = Array.isArray(diagram.vectors) ? diagram.vectors : []
  const valid = vectors.filter(
    (v) =>
      Array.isArray(v.tip) &&
      v.tip.length === 2 &&
      Number.isFinite(v.tip[0]) &&
      Number.isFinite(v.tip[1]),
  )

  if (valid.length === 0) {
    return null
  }

  const bound = fitBound(diagram, valid)

  return (
    <figure className="tutor-diagram">
      <CoordinatePlane min={-bound} max={bound} className="tutor-diagram__plane">
        {valid.map((v, index) => (
          <Vector
            key={index}
            tip={v.tip}
            origin={Array.isArray(v.origin) && v.origin.length === 2 ? v.origin : [0, 0]}
            color={COLOR_VARS[v.color ?? 'a'] ?? COLOR_VARS.a}
            dashed={Boolean(v.dashed)}
            label={v.label}
          />
        ))}
      </CoordinatePlane>
      {diagram.caption && <figcaption className="tutor-diagram__caption">{diagram.caption}</figcaption>}
    </figure>
  )
}
