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
  /**
   * Current position of the handle this hook controls (math coordinates). When provided, dragging
   * is relative: grabbing the handle off-center keeps that offset instead of teleporting the
   * handle to the cursor. When omitted, the handle snaps to the cursor (legacy absolute mode).
   */
  value?: Vec2
}

export function useSvgPointer({
  bounds,
  onDrag,
  onDragEnd,
  enabled = true,
  svgRef: externalSvgRef,
  value,
}: UseSvgPointerOptions) {
  const internalSvgRef = useRef<SVGSVGElement>(null)
  const svgRef = externalSvgRef ?? internalSvgRef
  const draggingRef = useRef(false)
  const lastPositionRef = useRef<Vec2>([0, 0])
  // Offset (math units) between the handle's center and the cursor at grab time. Keeps relative
  // dragging from snapping the handle to wherever the cursor first lands.
  const grabOffsetRef = useRef<Vec2>([0, 0])

  const updatePosition = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current
      if (!svg) {
        return
      }

      const pointer = clientToSvg(svg, clientX, clientY)
      const next = clampToBounds(
        [pointer[0] + grabOffsetRef.current[0], pointer[1] + grabOffsetRef.current[1]],
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

      const svg = svgRef.current
      if (value && svg) {
        // Relative mode: remember the grab offset and leave the handle where it is (no teleport).
        const pointer = clientToSvg(svg, event.clientX, event.clientY)
        grabOffsetRef.current = [value[0] - pointer[0], value[1] - pointer[1]]
        lastPositionRef.current = [...value]
        return
      }

      // Absolute mode (legacy): snap the handle to the cursor immediately.
      grabOffsetRef.current = [0, 0]
      updatePosition(event.clientX, event.clientY)
    },
    [enabled, svgRef, updatePosition, value],
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
