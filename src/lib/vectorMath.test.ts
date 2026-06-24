import { describe, it, expect } from 'vitest'
import {
  add,
  clampToBounds,
  distance,
  equalsWithTolerance,
  magnitude,
  roundForDisplay,
  scale,
  type Vec2,
} from './vectorMath'

describe('add', () => {
  it('adds componentwise', () => {
    expect(add([1, 2], [3, 4])).toEqual([4, 6])
  })

  it('handles negatives', () => {
    expect(add([5, -1], [-2, 3])).toEqual([3, 2])
  })
})

describe('scale', () => {
  it('multiplies both components by the factor', () => {
    expect(scale([2, -3], 3)).toEqual([6, -9])
  })

  it('scaling by zero yields the zero vector', () => {
    expect(scale([4, 7], 0)).toEqual([0, 0])
  })
})

describe('magnitude', () => {
  it('returns the Euclidean length', () => {
    expect(magnitude([3, 4])).toBe(5)
  })

  it('is zero for the zero vector', () => {
    expect(magnitude([0, 0])).toBe(0)
  })
})

describe('distance', () => {
  it('returns the Euclidean distance between two points', () => {
    expect(distance([0, 0], [3, 4])).toBe(5)
  })

  it('is zero for identical points', () => {
    expect(distance([2, 2], [2, 2])).toBe(0)
  })
})

describe('equalsWithTolerance', () => {
  it('returns true when within tolerance', () => {
    expect(equalsWithTolerance([1, 1], [1.2, 1], 0.5)).toBe(true)
  })

  it('returns true exactly at the tolerance boundary', () => {
    expect(equalsWithTolerance([0, 0], [0.5, 0], 0.5)).toBe(true)
  })

  it('returns false when outside tolerance', () => {
    expect(equalsWithTolerance([0, 0], [1, 1], 0.5)).toBe(false)
  })
})

describe('clampToBounds', () => {
  it('leaves an in-bounds vector unchanged', () => {
    expect(clampToBounds([2, -3], -5, 5)).toEqual([2, -3])
  })

  it('clamps components above max', () => {
    expect(clampToBounds([9, 2], -5, 5)).toEqual([5, 2])
  })

  it('clamps components below min', () => {
    expect(clampToBounds([-9, -7], -5, 5)).toEqual([-5, -5])
  })
})

describe('roundForDisplay', () => {
  it('rounds each component to one decimal place', () => {
    expect(roundForDisplay([1.234, 5.678])).toEqual([1.2, 5.7])
  })

  it('rounds negatives correctly', () => {
    const result: Vec2 = roundForDisplay([-1.25, -1.24])
    expect(result).toEqual([-1.2, -1.2])
  })
})
