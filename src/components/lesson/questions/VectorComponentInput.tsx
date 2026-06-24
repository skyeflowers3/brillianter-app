import { useState } from 'react'
import type { Vec2 } from '../../../lib/vectorMath'

interface VectorComponentInputProps {
  name: string
  value: Vec2
  onChange: (next: Vec2) => void
  disabled?: boolean
  color?: string
}

function parseInteger(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '' || trimmed === '-') {
    return null
  }

  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return null
  }

  return parsed
}

function VectorComponentInputInner({
  name,
  value,
  onChange,
  disabled = false,
  color,
}: VectorComponentInputProps) {
  const [xText, setXText] = useState(String(value[0]))
  const [yText, setYText] = useState(String(value[1]))

  const tryCommit = (nextX: string, nextY: string) => {
    const x = parseInteger(nextX)
    const y = parseInteger(nextY)
    if (x !== null && y !== null) {
      onChange([x, y])
    }
  }

  return (
    <span
      className="column-vector column-vector--input"
      style={color ? { color } : undefined}
    >
      <span className="column-vector__bracket column-vector__bracket--left" aria-hidden="true" />
      <span className="column-vector__components">
        <input
          type="text"
          inputMode="numeric"
          className="column-vector__field"
          value={xText}
          disabled={disabled}
          aria-label={`${name} x component`}
          onChange={(event) => {
            setXText(event.target.value)
            tryCommit(event.target.value, yText)
          }}
        />
        <input
          type="text"
          inputMode="numeric"
          className="column-vector__field"
          value={yText}
          disabled={disabled}
          aria-label={`${name} y component`}
          onChange={(event) => {
            setYText(event.target.value)
            tryCommit(xText, event.target.value)
          }}
        />
      </span>
      <span className="column-vector__bracket column-vector__bracket--right" aria-hidden="true" />
    </span>
  )
}

export function VectorComponentInput(props: VectorComponentInputProps) {
  const { value } = props

  return (
    <VectorComponentInputInner
      key={`${value[0]}:${value[1]}`}
      {...props}
    />
  )
}
