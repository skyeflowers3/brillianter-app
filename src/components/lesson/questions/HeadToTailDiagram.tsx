import { memo } from 'react'
import { Vector } from '../../svg/Vector'
import type { Vec2 } from '../../../lib/vectorMath'

interface HeadToTailDiagramProps {
  vectorA: Vec2
  vectorB?: Vec2
  draggableA?: boolean
  draggableB?: boolean
  onDragA?: (event: React.PointerEvent<SVGCircleElement>) => void
  onDragB?: (event: React.PointerEvent<SVGCircleElement>) => void
  onPointerMove?: (event: React.PointerEvent<SVGCircleElement>) => void
  onPointerUp?: (event: React.PointerEvent<SVGCircleElement>) => void
}

/** Head-to-tail only: a from origin, b from the tip of a. */
export const HeadToTailDiagram = memo(function HeadToTailDiagram({
  vectorA,
  vectorB,
  draggableA = false,
  draggableB = false,
  onDragA,
  onDragB,
  onPointerMove,
  onPointerUp,
}: HeadToTailDiagramProps) {
  const pointerHandlers = {
    onHandlePointerMove: onPointerMove,
    onHandlePointerUp: onPointerUp,
    onHandlePointerCancel: onPointerUp,
  }

  return (
    <>
      <Vector
        tip={vectorA}
        color="var(--lesson-vector-a)"
        label="a"
        draggable={draggableA}
        dashed={!draggableA}
        onHandlePointerDown={onDragA}
        {...pointerHandlers}
      />
      {vectorB && (
        <Vector
          tip={vectorB}
          origin={vectorA}
          color="var(--lesson-vector-b)"
          label="b"
          draggable={draggableB}
          dashed={!draggableB}
          onHandlePointerDown={onDragB}
          {...pointerHandlers}
        />
      )}
    </>
  )
})
