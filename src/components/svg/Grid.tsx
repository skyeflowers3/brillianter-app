import { memo, type ReactElement } from 'react'

interface GridProps {
  min: number
  max: number
  step?: number
}

export const Grid = memo(function Grid({ min, max, step = 1 }: GridProps) {
  const lines: ReactElement[] = []
  const numbers: ReactElement[] = []

  for (let value = min; value <= max; value += step) {
    lines.push(
      <line
        key={`v-${value}`}
        x1={value}
        y1={-max}
        x2={value}
        y2={-min}
        className="coordinate-plane__grid-line"
      />,
    )
    lines.push(
      <line
        key={`h-${value}`}
        x1={min}
        y1={-value}
        x2={max}
        y2={-value}
        className="coordinate-plane__grid-line"
      />,
    )

    if (value !== 0 && value !== min && value !== max) {
      numbers.push(
        <text
          key={`nx-${value}`}
          x={value}
          y={0.5}
          textAnchor="middle"
          className="coordinate-plane__grid-number"
        >
          {value}
        </text>,
      )
      numbers.push(
        <text
          key={`ny-${value}`}
          x={-0.25}
          y={-value}
          textAnchor="end"
          dominantBaseline="middle"
          className="coordinate-plane__grid-number"
        >
          {value}
        </text>,
      )
    }
  }

  return (
    <g className="coordinate-plane__grid">
      {lines}
      {numbers}
    </g>
  )
})
