import { describe, it, expect } from 'vitest'
import { clientToSvg, mathToSvg, svgToMath } from './svgMath'
import type { Vec2 } from './vectorMath'

describe('mathToSvg / svgToMath', () => {
  it('flips the sign of the y component', () => {
    expect(mathToSvg([3, 4])).toEqual([3, -4])
    expect(svgToMath([3, 4])).toEqual([3, -4])
  })

  it('round-trips back to the original vector', () => {
    const original: Vec2 = [2, -5]
    expect(svgToMath(mathToSvg(original))).toEqual(original)
    expect(mathToSvg(svgToMath(original))).toEqual(original)
  })

  it('leaves the origin at the origin (negating 0 yields -0, still zero-valued)', () => {
    const [x, y] = mathToSvg([0, 0])
    expect(x).toBe(0)
    expect(Math.abs(y)).toBe(0)
  })
})

describe('clientToSvg', () => {
  // jsdom does not implement SVGSVGElement.createSVGPoint / getScreenCTM, so we provide a
  // minimal fake SVG element. The point applies the inverse CTM, then svgToMath flips y.
  function makeFakeSvg(ctmInverse: { a: number; d: number; e: number; f: number }): SVGSVGElement {
    const point = {
      x: 0,
      y: 0,
      matrixTransform(matrix: { a: number; d: number; e: number; f: number }): { x: number; y: number } {
        return { x: this.x * matrix.a + matrix.e, y: this.y * matrix.d + matrix.f }
      },
    }

    return {
      createSVGPoint: () => point,
      getScreenCTM: () => ({ inverse: () => ctmInverse }),
    } as unknown as SVGSVGElement
  }

  it('transforms client coordinates through the inverse CTM and flips y', () => {
    // Identity inverse CTM: svgPoint = (clientX, clientY); svgToMath flips y.
    const svg = makeFakeSvg({ a: 1, d: 1, e: 0, f: 0 })
    expect(clientToSvg(svg, 3, 4)).toEqual([3, -4])
  })

  it('applies a translation/scale from the inverse CTM', () => {
    // svgPoint.x = clientX * 0.5 - 10, svgPoint.y = clientY * 0.5 - 20
    const svg = makeFakeSvg({ a: 0.5, d: 0.5, e: -10, f: -20 })
    expect(clientToSvg(svg, 40, 60)).toEqual([10, -10])
  })

  it('returns [0, 0] when there is no screen CTM', () => {
    const svg = {
      createSVGPoint: () => ({ x: 0, y: 0, matrixTransform: () => ({ x: 1, y: 1 }) }),
      getScreenCTM: () => null,
    } as unknown as SVGSVGElement
    expect(clientToSvg(svg, 5, 5)).toEqual([0, 0])
  })
})
