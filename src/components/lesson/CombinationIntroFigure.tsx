import { useEffect, useState } from 'react'
import { CoordinatePlane } from '../svg/CoordinatePlane'
import { Vector } from '../svg/Vector'
import { add, scale, type Vec2 } from '../../lib/vectorMath'

interface CombinationIntroFigureProps {
  vectorA: Vec2
  vectorB: Vec2
  coefA: number
  coefB: number
}

const STAGE_MS = 1700
const PLANE_MIN = -6
const PLANE_MAX = 6

function scaledLabel(scalar: number, name: string): string {
  if (Math.abs(scalar - 1) < 0.001) return name
  if (Math.abs(scalar + 1) < 0.001) return `−${name}`
  return `${scalar}${name}`
}

/**
 * Looping intro animation for linear combinations: scale A → leave B → connect head-to-tail →
 * draw the result cA + dB. Each stage fades in so learners see the Scale → Connect → Draw process
 * before they try it.
 */
export function CombinationIntroFigure({
  vectorA,
  vectorB,
  coefA,
  coefB,
}: CombinationIntroFigureProps) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStage((prev) => (prev + 1) % 3), STAGE_MS)
    return () => clearInterval(id)
  }, [])

  const scaledA = scale(vectorA, coefA)
  const scaledB = scale(vectorB, coefB)
  const result = add(scaledA, scaledB)

  const aLabel = scaledLabel(coefA, 'A')
  const bLabel = scaledLabel(coefB, 'B')
  const resultLabel = `${aLabel} + ${bLabel}`

  const caption =
    stage === 0
      ? `Scale A into ${aLabel}`
      : stage === 1
        ? `Connect them head-to-tail`
        : `Draw the result: ${resultLabel}`

  return (
    <div className="combination-intro">
      <p className="combination-intro__caption">{caption}</p>
      <div className="combination-intro__grid">
        <CoordinatePlane min={PLANE_MIN} max={PLANE_MAX}>
          <g key={stage} className="combination-intro__stage">
            {stage === 0 && (
              <>
                <Vector tip={vectorA} color="var(--lesson-vector-a)" label="A" dashed />
                <Vector tip={scaledA} color="var(--lesson-vector-a)" label={aLabel} />
              </>
            )}

            {stage === 1 && (
              <>
                <Vector tip={scaledA} color="var(--lesson-vector-a)" label={aLabel} />
                <Vector
                  origin={scaledA}
                  tip={scaledB}
                  color="var(--lesson-vector-b)"
                  label={bLabel}
                />
              </>
            )}

            {stage === 2 && (
              <>
                <Vector tip={scaledA} color="var(--lesson-vector-a)" label={aLabel} />
                <Vector
                  origin={scaledA}
                  tip={scaledB}
                  color="var(--lesson-vector-b)"
                  label={bLabel}
                />
                <Vector tip={result} color="var(--lesson-vector-sum)" label={resultLabel} />
              </>
            )}
          </g>
        </CoordinatePlane>
      </div>
    </div>
  )
}
