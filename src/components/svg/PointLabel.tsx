import { useId } from 'react'
import { mathToSvg } from '../../lib/svgMath'
import type { Vec2 } from '../../lib/vectorMath'
import { useVectorLabel } from './vectorLabelRegistry'

interface PointLabelProps {
  /** Anchor point in math coordinates (y-up). */
  point: Vec2
  text: string
  color?: string
}

/**
 * A floating text label anchored near a point. It registers with the plane's label layer (as a
 * zero-length entry) so it is placed clear of the axes, grid numbers, vectors, and other labels,
 * and so other labels avoid it in turn. Renders nothing itself; the layer paints it.
 */
export function PointLabel({ point, text, color = 'var(--lesson-target)' }: PointLabelProps) {
  const id = useId()
  const [x, y] = mathToSvg(point)
  useVectorLabel(id, text, color, x, y, x, y)
  return null
}
