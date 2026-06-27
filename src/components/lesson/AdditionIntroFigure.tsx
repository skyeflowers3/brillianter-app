import { Vector } from '../svg/Vector'
import { add, type Vec2 } from '../../lib/vectorMath'
import { SteppedIntroFigure, type IntroStep } from './SteppedIntroFigure'

interface AdditionIntroFigureProps {
  vectorA: Vec2
  vectorB: Vec2
}

/**
 * Looping intro animation for addition: show A and B → slide B head-to-tail onto A → draw A + B.
 * Mirrors the subtraction intro's step-by-step format.
 */
export function AdditionIntroFigure({ vectorA, vectorB }: AdditionIntroFigureProps) {
  const sum = add(vectorA, vectorB)

  const coords = [0, vectorA[0], vectorB[0], sum[0], vectorA[1], vectorB[1], sum[1]]
  const planeMin = Math.min(-1, Math.floor(Math.min(...coords)) - 1)
  const planeMax = Math.ceil(Math.max(...coords)) + 2

  const steps: IntroStep[] = [
    {
      caption: 'Start with A and B',
      content: (
        <>
          <Vector tip={vectorA} color="var(--lesson-vector-a)" label="A" />
          <Vector tip={vectorB} color="var(--lesson-vector-b)" label="B" />
        </>
      ),
    },
    {
      caption: 'Slide B head-to-tail onto A',
      content: (
        <>
          <Vector tip={vectorA} color="var(--lesson-vector-a)" label="A" />
          <Vector origin={vectorA} tip={vectorB} color="var(--lesson-vector-b)" label="B" />
        </>
      ),
    },
    {
      caption: 'Draw A + B',
      content: (
        <>
          <Vector tip={vectorA} color="var(--lesson-vector-a)" label="A" />
          <Vector origin={vectorA} tip={vectorB} color="var(--lesson-vector-b)" label="B" />
          <Vector tip={sum} color="var(--lesson-vector-sum)" label="A + B" />
        </>
      ),
    },
  ]

  return <SteppedIntroFigure steps={steps} planeMin={planeMin} planeMax={planeMax} />
}
