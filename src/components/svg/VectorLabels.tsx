import { useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  computeLabelLayout,
  LayoutContext,
  RegistryContext,
  type LayoutValue,
  type RegistryValue,
  type VectorLabelEntry,
} from './vectorLabelRegistry'

export function VectorLabelProvider({
  min,
  max,
  children,
}: {
  min: number
  max: number
  children: ReactNode
}) {
  const [entries, setEntries] = useState<Map<string, VectorLabelEntry>>(() => new Map())

  const register = useCallback((entry: VectorLabelEntry) => {
    setEntries((prev) => {
      const existing = prev.get(entry.id)
      if (
        existing &&
        existing.text === entry.text &&
        existing.color === entry.color &&
        existing.origin[0] === entry.origin[0] &&
        existing.origin[1] === entry.origin[1] &&
        existing.end[0] === entry.end[0] &&
        existing.end[1] === entry.end[1] &&
        existing.offset?.[0] === entry.offset?.[0] &&
        existing.offset?.[1] === entry.offset?.[1]
      ) {
        return prev
      }
      const next = new Map(prev)
      next.set(entry.id, entry)
      return next
    })
  }, [])

  const unregister = useCallback((id: string) => {
    setEntries((prev) => {
      if (!prev.has(id)) {
        return prev
      }
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  const registry = useMemo<RegistryValue>(() => ({ register, unregister }), [register, unregister])
  const layout = useMemo<LayoutValue>(() => ({ entries, min, max }), [entries, min, max])

  return (
    <RegistryContext.Provider value={registry}>
      <LayoutContext.Provider value={layout}>{children}</LayoutContext.Provider>
    </RegistryContext.Provider>
  )
}

export function VectorLabelLayer() {
  const layout = useContext(LayoutContext)

  const placed = useMemo(() => {
    if (!layout) {
      return []
    }
    return computeLabelLayout([...layout.entries.values()], layout.min, layout.max)
  }, [layout])

  if (placed.length === 0) {
    return null
  }

  return (
    <g className="vector-labels">
      {placed.map(({ id, text, color, box }) => (
        <text
          key={id}
          x={box.x + box.w / 2}
          y={box.y + box.h / 2}
          className="vector-label__text"
          style={{ fill: color }}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {text}
        </text>
      ))}
    </g>
  )
}
