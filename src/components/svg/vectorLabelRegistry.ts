import { createContext, useContext, useLayoutEffect } from 'react'

/** A vector's geometry + label, expressed in SVG user coordinates (y-down). */
export interface VectorLabelEntry {
  id: string
  origin: [number, number]
  end: [number, number]
  text: string
  color: string
  /** Optional manual nudge (SVG units) applied to the auto-placed label position. */
  offset?: [number, number]
}

export interface RegistryValue {
  register: (entry: VectorLabelEntry) => void
  unregister: (id: string) => void
}

export interface LayoutValue {
  entries: Map<string, VectorLabelEntry>
  min: number
  max: number
}

export const RegistryContext = createContext<RegistryValue | null>(null)
export const LayoutContext = createContext<LayoutValue | null>(null)

/**
 * Register a vector's label with the plane so positions can be laid out together. Pass a
 * `text` of undefined to skip the label entirely (e.g. a zero-length vector).
 */
export function useVectorLabel(
  id: string,
  text: string | undefined,
  color: string,
  originX: number,
  originY: number,
  endX: number,
  endY: number,
  offsetX = 0,
  offsetY = 0,
) {
  const registry = useContext(RegistryContext)

  useLayoutEffect(() => {
    if (!registry || !text) {
      return
    }

    registry.register({
      id,
      text,
      color,
      origin: [originX, originY],
      end: [endX, endY],
      offset: offsetX !== 0 || offsetY !== 0 ? [offsetX, offsetY] : undefined,
    })

    return () => registry.unregister(id)
  }, [registry, id, text, color, originX, originY, endX, endY, offsetX, offsetY])
}

// --- Layout heuristics (all in SVG user units, which equal one grid square) ---

const FONT_SIZE = 0.45 // matches .vector-label__text font-size
const CHAR_WIDTH = 0.27
const PAD_X = 0.14
const PAD_Y = 0.1
const PERP_STEP = 0.55 // perpendicular offset increment from the vector
const ENDPOINT_RADIUS = 0.45 // keep clear of arrowheads / handles / endpoints
const BOUND_PAD = 0.15
const GAP = 0.05

interface Box {
  x: number
  y: number
  w: number
  h: number
}

function labelBox(centerX: number, centerY: number, text: string): Box {
  const w = text.length * CHAR_WIDTH + PAD_X * 2
  const h = FONT_SIZE + PAD_Y * 2
  return { x: centerX - w / 2, y: centerY - h / 2, w, h }
}

function clampBox(box: Box, min: number, max: number): Box {
  const x = Math.max(min + BOUND_PAD, Math.min(box.x, max - BOUND_PAD - box.w))
  const y = Math.max(min + BOUND_PAD, Math.min(box.y, max - BOUND_PAD - box.h))
  return { x, y, w: box.w, h: box.h }
}

function boxesOverlap(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.w + GAP &&
    a.x + a.w + GAP > b.x &&
    a.y < b.y + b.h + GAP &&
    a.y + a.h + GAP > b.y
  )
}

function pointBox(point: [number, number]): Box {
  return {
    x: point[0] - ENDPOINT_RADIUS,
    y: point[1] - ENDPOINT_RADIUS,
    w: ENDPOINT_RADIUS * 2,
    h: ENDPOINT_RADIUS * 2,
  }
}

interface Segment {
  a: [number, number]
  b: [number, number]
}

function pointInBox(px: number, py: number, box: Box): boolean {
  return px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h
}

function segmentsIntersect(
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  p4: [number, number],
): boolean {
  // Cross-product orientation tests for the two segments.
  const o1 = (p4[0] - p3[0]) * (p1[1] - p3[1]) - (p4[1] - p3[1]) * (p1[0] - p3[0])
  const o2 = (p4[0] - p3[0]) * (p2[1] - p3[1]) - (p4[1] - p3[1]) * (p2[0] - p3[0])
  const o3 = (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0])
  const o4 = (p2[0] - p1[0]) * (p4[1] - p1[1]) - (p2[1] - p1[1]) * (p4[0] - p1[0])
  return o1 * o2 < 0 && o3 * o4 < 0
}

/** Whether a vector's line segment passes through (or starts inside) the label box. */
function segmentHitsBox(seg: Segment, box: Box): boolean {
  const inflated: Box = {
    x: box.x - GAP,
    y: box.y - GAP,
    w: box.w + GAP * 2,
    h: box.h + GAP * 2,
  }

  if (pointInBox(seg.a[0], seg.a[1], inflated) || pointInBox(seg.b[0], seg.b[1], inflated)) {
    return true
  }

  const corners: [number, number][] = [
    [inflated.x, inflated.y],
    [inflated.x + inflated.w, inflated.y],
    [inflated.x + inflated.w, inflated.y + inflated.h],
    [inflated.x, inflated.y + inflated.h],
  ]

  for (let i = 0; i < 4; i += 1) {
    const next = corners[(i + 1) % 4]
    if (segmentsIntersect(seg.a, seg.b, corners[i], next)) {
      return true
    }
  }

  return false
}

export interface PlacedLabel {
  id: string
  text: string
  color: string
  box: Box
}

export function computeLabelLayout(
  entries: VectorLabelEntry[],
  min: number,
  max: number,
): PlacedLabel[] {
  const endpoints: [number, number][] = []
  const segments: Segment[] = []
  for (const entry of entries) {
    endpoints.push(entry.origin, entry.end)
    segments.push({ a: entry.origin, b: entry.end })
  }

  const placedBoxes: Box[] = []
  const results: PlacedLabel[] = []

  for (const entry of entries) {
    const [ox, oy] = entry.origin
    const [ex, ey] = entry.end
    const midX = (ox + ex) / 2
    const midY = (oy + ey) / 2

    const dx = ex - ox
    const dy = ey - oy
    const len = Math.hypot(dx, dy)

    // Unit perpendicular to the vector direction (defaults to "above" for a zero vector).
    let perpX = 0
    let perpY = -1
    if (len > 1e-6) {
      perpX = -dy / len
      perpY = dx / len
    }

    // Candidate centers: midpoint pushed perpendicular both ways at growing distances,
    // plus spots biased toward the tip and the tail, so a clear slot can be found.
    const anchors: [number, number][] = [
      [midX, midY],
      [midX + dx * 0.25, midY + dy * 0.25],
      [midX - dx * 0.25, midY - dy * 0.25],
    ]
    const candidates: [number, number][] = []
    for (let step = 1; step <= 8; step += 1) {
      const dist = PERP_STEP * step
      for (const [ax, ay] of anchors) {
        candidates.push([ax + perpX * dist, ay + perpY * dist])
        candidates.push([ax - perpX * dist, ay - perpY * dist])
      }
    }

    // Score each candidate; 0 means it touches nothing but (allowed) grid lines.
    const conflictScore = (box: Box): number => {
      let score = 0
      for (const other of placedBoxes) {
        if (boxesOverlap(box, other)) score += 4
      }
      for (const seg of segments) {
        if (segmentHitsBox(seg, box)) score += 2
      }
      for (const point of endpoints) {
        if (boxesOverlap(box, pointBox(point))) score += 1
      }
      return score
    }

    let chosen: Box | null = null
    let bestBox: Box | null = null
    let bestScore = Infinity
    for (const [cx, cy] of candidates) {
      const box = clampBox(labelBox(cx, cy, entry.text), min, max)
      const score = conflictScore(box)
      if (score === 0) {
        chosen = box
        break
      }
      if (score < bestScore) {
        bestScore = score
        bestBox = box
      }
    }

    // Fall back to the least-conflicting spot if nothing was fully clear.
    let placed = chosen ?? bestBox ?? clampBox(labelBox(midX, midY, entry.text), min, max)

    // Apply any manual nudge, then keep it inside the plane.
    if (entry.offset) {
      placed = clampBox(
        { ...placed, x: placed.x + entry.offset[0], y: placed.y + entry.offset[1] },
        min,
        max,
      )
    }

    placedBoxes.push(placed)
    results.push({ id: entry.id, text: entry.text, color: entry.color, box: placed })
  }

  return results
}
