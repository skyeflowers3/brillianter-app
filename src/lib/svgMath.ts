import type { Vec2 } from './vectorMath'

/** Convert math coordinates (y-up) to SVG user coordinates (y-down). */
export function mathToSvg([x, y]: Vec2): Vec2 {
  return [x, -y]
}

/** Convert SVG user coordinates to math coordinates (y-up). */
export function svgToMath([x, y]: Vec2): Vec2 {
  return [x, -y]
}

/**
 * Endpoints (in math coordinates) of the line through the origin in direction `dir`, clipped to the
 * visible [min, max]² box. Useful for drawing a span line that fills the plane.
 */
export function lineThroughOriginEndpoints([dx, dy]: Vec2, min: number, max: number): [Vec2, Vec2] {
  let tPos = Infinity
  let tNeg = -Infinity

  const consider = (component: number) => {
    if (component === 0) {
      return
    }
    tPos = Math.min(tPos, (component > 0 ? max : min) / component)
    tNeg = Math.max(tNeg, (component > 0 ? min : max) / component)
  }

  consider(dx)
  consider(dy)

  if (!Number.isFinite(tPos) || !Number.isFinite(tNeg)) {
    return [
      [0, 0],
      [0, 0],
    ]
  }

  return [
    [tNeg * dx, tNeg * dy],
    [tPos * dx, tPos * dy],
  ]
}

export function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number): Vec2 {
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY

  const ctm = svg.getScreenCTM()
  if (!ctm) {
    return [0, 0]
  }

  const svgPoint = point.matrixTransform(ctm.inverse())
  return svgToMath([svgPoint.x, svgPoint.y])
}
