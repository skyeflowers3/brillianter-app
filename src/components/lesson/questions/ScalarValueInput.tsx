import { useEffect, useRef, useState } from 'react'

interface ScalarValueInputProps {
  value: number
  onChange: (next: number) => void
  disabled?: boolean
  color?: string
}

function parseScalar(raw: string): number | null {
  const trimmed = raw.trim()
  // Partial entries (empty, a lone sign, or a lone decimal point) are not a number yet.
  if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') {
    return null
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function ScalarValueInput({ value, onChange, disabled = false, color }: ScalarValueInputProps) {
  const [text, setText] = useState(() => (value === 0 ? '' : String(value)))
  // Tracks the last value we emitted so we only resync the field when `value` changes for an
  // external reason (e.g. restoring a saved answer), not in response to the learner's typing.
  const lastEmitted = useRef(value)

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setText(value === 0 ? '' : String(value))
      lastEmitted.current = value
    }
  }, [value])

  return (
    <span className="scalar-value-input" style={color ? { color } : undefined}>
      <span className="scalar-value-input__name">c =</span>
      <input
        type="text"
        inputMode="numeric"
        className="scalar-value-input__field"
        value={text}
        disabled={disabled}
        aria-label="scalar c"
        onChange={(event) => {
          const raw = event.target.value
          setText(raw)
          // A partial/invalid entry counts as "no answer" (0) so a previously valid value can't
          // silently pass validation after the learner deletes part of it.
          const next = parseScalar(raw) ?? 0
          lastEmitted.current = next
          onChange(next)
        }}
      />
    </span>
  )
}
