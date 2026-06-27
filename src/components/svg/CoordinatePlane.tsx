import { forwardRef, type ReactNode } from 'react'
import { Grid } from './Grid'
import { VectorLabelLayer, VectorLabelProvider } from './VectorLabels'
// The coordinate-plane / grid / axis styles live in lesson.css. Import them here so the plane is
// always styled wherever it renders (lessons, skill checks, tutor diagrams, remediation). Without
// this, visiting a skill check before any lesson loaded the route without lesson.css's chunk, so the
// grid rendered as a blank black box.
import '../../styles/lesson.css'

interface CoordinatePlaneProps {
  children?: ReactNode
  min?: number
  max?: number
  className?: string
}

export const CoordinatePlane = forwardRef<SVGSVGElement, CoordinatePlaneProps>(
  function CoordinatePlane({ children, min = -8, max = 8, className = '' }, ref) {
    const axisEnd = max - 0.5

    return (
      <svg
        ref={ref}
        className={`coordinate-plane ${className}`.trim()}
        viewBox={`${min} ${-max} ${max - min} ${max - min}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Coordinate plane"
      >
        <defs>
          <marker
            id="vector-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="coordinate-plane__arrowhead" />
          </marker>
          <marker
            id="vector-arrow-open"
            viewBox="0 0 10 10"
            refX="7.5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            markerUnits="strokeWidth"
            orient="auto-start-reverse"
          >
            <path
              d="M 2.5 1.5 L 8.5 5 L 2.5 8.5"
              fill="none"
              stroke="context-stroke"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>

        <rect
          x={min}
          y={-max}
          width={max - min}
          height={max - min}
          className="coordinate-plane__background"
        />

        <Grid min={min} max={max} />

        <g className="coordinate-plane__axes">
          <line x1={min} y1={0} x2={axisEnd} y2={0} markerEnd="url(#vector-arrow)" />
          <line x1={0} y1={-min} x2={0} y2={-axisEnd} markerEnd="url(#vector-arrow)" />
        </g>

        <g className="coordinate-plane__labels">
          <text x={axisEnd} y={0.6} className="coordinate-plane__axis-label">
            x
          </text>
          <text x={0.4} y={-axisEnd} className="coordinate-plane__axis-label">
            y
          </text>
        </g>

        <VectorLabelProvider min={min} max={max}>
          {children}
          <VectorLabelLayer />
        </VectorLabelProvider>
      </svg>
    )
  },
)
