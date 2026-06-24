import { memo } from 'react'
import { HeadToTailDiagram } from './HeadToTailDiagram'
import type { Vec2 } from '../../../lib/vectorMath'

interface FixedHeadToTailPairProps {
  vectorA: Vec2
  vectorB: Vec2
}

/** Immutable a + b head-to-tail pair — skips re-render while only the sum moves. */
export const FixedHeadToTailPair = memo(function FixedHeadToTailPair({
  vectorA,
  vectorB,
}: FixedHeadToTailPairProps) {
  return <HeadToTailDiagram vectorA={vectorA} vectorB={vectorB} />
})
