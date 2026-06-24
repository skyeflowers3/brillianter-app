export type Vec2 = [number, number]

export function magnitude([x, y]: Vec2): number {
  return Math.hypot(x, y)
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

export function equalsWithTolerance(a: Vec2, b: Vec2, tolerance: number): boolean {
  return distance(a, b) <= tolerance
}

export function clampToBounds([x, y]: Vec2, min: number, max: number): Vec2 {
  return [
    Math.min(max, Math.max(min, x)),
    Math.min(max, Math.max(min, y)),
  ]
}

export function roundForDisplay([x, y]: Vec2): Vec2 {
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10]
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return [a[0] + b[0], a[1] + b[1]]
}

export function scale([x, y]: Vec2, factor: number): Vec2 {
  return [x * factor, y * factor]
}
