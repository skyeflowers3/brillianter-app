import { useCallback, useRef, type RefObject } from 'react'
import { clientToSvg } from '../lib/svgMath'
import { clampToBounds, type Vec2 } from '../lib/vectorMath'

interface UseSvgPointerOptions {
  bounds: { min: number; max: number }
  onDrag: (position: Vec2) => void
  onDragEnd?: (position: Vec2) => void
  enabled?: boolean
  /** Share a single SVG ref across multiple pointer hooks (e.g. two independent draggables). */
  svgRef?: RefObject<SVGSVGElement | null>
}

export function useSvgPointer({
  bounds,
  onDrag,
  onDragEnd,
  enabled = true,
  svgRef: externalSvgRef,
}: UseSvgPointerOptions) {
  const internalSvgRef = useRef<SVGSVGElement>(null)
  const svgRef = externalSvgRef ?? internalSvgRef
  const draggingRef = useRef(false)
  const lastPositionRef = useRef<Vec2>([0, 0])

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) {
        return
      }

      const next = clampToBounds(
        clientToSvg(svg, clientX, clientY),
        bounds.min,
        bounds.max,
      )
      lastPositionRef.current = next
      onDrag(next)
    },
    [bounds.max, bounds.min, onDrag, svgRef],
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGElement>) => {
      if (!enabled) {
        return
      }

      draggingRef.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
      updatePosition(event.clientX, event.clientY)
    },
    [enabled, updatePosition],
  )

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<SVGElement>) => {
      if (!enabled || !draggingRef.current) {
        return
      }

      updatePosition(event.clientX, event.clientY)
    },
    [enabled, updatePosition],
  )

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<SVGElement>) => {
      if (!draggingRef.current) {
        return
      }

      draggingRef.current = false
      event.currentTarget.releasePointerCapture(event.pointerId)
      onDragEnd?.(lastPositionRef.current)
    },
    [onDragEnd],
  )

  return {
    svgRef,
    pointerHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
  }
}
