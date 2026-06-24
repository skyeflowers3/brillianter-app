import type { Vec2 } from './vectorMath'

/** Convert math coordinates (y-up) to SVG user coordinates (y-down). */
export function mathToSvg([x, y]: Vec2): Vec2 {
  return [x, -y]
}

/** Convert SVG user coordinates to math coordinates (y-up). */
export function svgToMath([x, y]: Vec2): Vec2 {
  return [x, -y]
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
