import { useEffect, useState } from 'react'
import { CoordinatePlane } from '../svg/CoordinatePlane'
import { Vector } from '../svg/Vector'
import { add, scale, type Vec2 } from '../../lib/vectorMath'

interface SubtractionIntroFigureProps {
  vectorA: Vec2
  vectorB: Vec2
}

const STAGE_MS = 1600
const PLANE_MIN = -5
const PLANE_MAX = 5

/**
 * Looping intro animation for subtraction: B → reverse → −B → add A + (−B). Each stage fades in so
 * learners see the two-step process before they try it.
 */
export function SubtractionIntroFigure({ vectorA, vectorB }: SubtractionIntroFigureProps) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStage((prev) => (prev + 1) % 3), STAGE_MS)
    return () => clearInterval(id)
  }, [])

  const negB = scale(vectorB, -1)
  const diff = add(vectorA, negB)

  const caption =
    stage === 0 ? 'Start with B' : stage === 1 ? 'Reverse B to get −B' : 'Add A + (−B) = A − B'

  return (
    <div className="subtraction-intro">
      <p className="subtraction-intro__caption">{caption}</p>
      <div className="subtraction-intro__grid">
        <CoordinatePlane min={PLANE_MIN} max={PLANE_MAX}>
          <g key={stage} className="subtraction-intro__stage">
            {stage === 0 && <Vector tip={vectorB} color="var(--lesson-target)" label="B" />}

            {stage === 1 && <Vector tip={negB} color="var(--lesson-vector-b)" label="−B" />}

            {stage === 2 && (
              <>
                <Vector tip={vectorA} color="var(--lesson-vector-a)" label="A" />
                <Vector origin={vectorA} tip={negB} color="var(--lesson-vector-b)" label="−B" />
                <Vector tip={diff} color="var(--lesson-vector-sum)" label="A − B" />
              </>
            )}
          </g>
        </CoordinatePlane>
      </div>
    </div>
  )
}
