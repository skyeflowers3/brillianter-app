import { useEffect, useState, type ReactNode } from 'react'
import { CoordinatePlane } from '../svg/CoordinatePlane'

export interface IntroStep {
  /** Short explanation of what this step is doing, shown large above the grid. */
  caption: string
  /** SVG content drawn inside the coordinate plane for this step. */
  content: ReactNode
}

interface SteppedIntroFigureProps {
  steps: IntroStep[]
  planeMin: number
  planeMax: number
  stageMs?: number
  /** Extra class on the root, so individual intros can tweak sizing/layout. */
  className?: string
}

const DEFAULT_STAGE_MS = 1800

/**
 * Shared looping intro animation: walks through `steps` one at a time, fading each in, with a large
 * caption above a left-aligned grid. Vector intro, addition, and subtraction all use this so they
 * stay visually identical — only the vectors and captions differ.
 */
export function SteppedIntroFigure({
  steps,
  planeMin,
  planeMax,
  stageMs = DEFAULT_STAGE_MS,
  className = '',
}: SteppedIntroFigureProps) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (steps.length <= 1) {
      return
    }
    const id = setInterval(() => setStage((prev) => (prev + 1) % steps.length), stageMs)
    return () => clearInterval(id)
  }, [steps.length, stageMs])

  const current = steps[Math.min(stage, steps.length - 1)]

  return (
    <div className={`stepped-intro ${className}`.trim()}>
      <p className="stepped-intro__caption">{current.caption}</p>
      <div className="stepped-intro__grid">
        <CoordinatePlane min={planeMin} max={planeMax}>
          <g key={stage} className="stepped-intro__stage">
            {current.content}
          </g>
        </CoordinatePlane>
      </div>
    </div>
  )
}
