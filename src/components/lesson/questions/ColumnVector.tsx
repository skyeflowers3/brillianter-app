import type { Vec2 } from '../../../lib/vectorMath'

interface ColumnVectorProps {
  value: Vec2
  color?: string
  label?: string
}

/** Read-only column (vertical) vector display, e.g. a stacked ⟨x, y⟩. */
export function ColumnVector({ value, color, label }: ColumnVectorProps) {
  const [x, y] = value

  return (
    <span
      className="column-vector"
      style={color ? { color } : undefined}
      aria-label={label ? `${label} ${x}, ${y}` : `${x}, ${y}`}
    >
      <span className="column-vector__bracket column-vector__bracket--left" aria-hidden="true" />
      <span className="column-vector__components">
        <span className="column-vector__component">{x}</span>
        <span className="column-vector__component">{y}</span>
      </span>
      <span className="column-vector__bracket column-vector__bracket--right" aria-hidden="true" />
    </span>
  )
}
