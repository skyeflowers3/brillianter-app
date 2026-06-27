import { Vector } from '../svg/Vector'
import { add, scale, type Vec2 } from '../../lib/vectorMath'
import { SteppedIntroFigure, type IntroStep } from './SteppedIntroFigure'

interface SubtractionIntroFigureProps {
  vectorA: Vec2
  vectorB: Vec2
}

const PLANE_MIN = -5
const PLANE_MAX = 5

/**
 * Looping intro animation for subtraction: B → reverse → −B → add A + (−B). Each stage fades in so
 * learners see the two-step process before they try it.
 */
export function SubtractionIntroFigure({ vectorA, vectorB }: SubtractionIntroFigureProps) {
  const negB = scale(vectorB, -1)
  const diff = add(vectorA, negB)

  const steps: IntroStep[] = [
    {
      caption: 'Start with B',
      content: <Vector tip={vectorB} color="var(--lesson-target)" label="B" />,
    },
    {
      caption: 'Reverse B to get −B',
      content: <Vector tip={negB} color="var(--lesson-vector-b)" label="−B" />,
    },
    {
      caption: 'Add A + (−B) = A − B',
      content: (
        <>
          <Vector tip={vectorA} color="var(--lesson-vector-a)" label="A" />
          <Vector origin={vectorA} tip={negB} color="var(--lesson-vector-b)" label="−B" />
          <Vector tip={diff} color="var(--lesson-vector-sum)" label="A − B" />
        </>
      ),
    },
  ]

  return <SteppedIntroFigure steps={steps} planeMin={PLANE_MIN} planeMax={PLANE_MAX} />
}
