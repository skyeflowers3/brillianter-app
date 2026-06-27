import { CoordinatePlane } from '../svg/CoordinatePlane'
import { Vector } from '../svg/Vector'
import type { LessonIntro as LessonIntroContent } from '../../types/lesson'
import { VectorIntroFigure } from './VectorIntroFigure'
import { AdditionIntroFigure } from './AdditionIntroFigure'
import { SubtractionIntroFigure } from './SubtractionIntroFigure'
import { CombinationIntroFigure } from './CombinationIntroFigure'

/**
 * The teaching figure(s) for a lesson's intro, picked from whichever sample the lesson content
 * provides. Extracted from LessonIntro so the same hand-built visuals can be reused elsewhere (e.g.
 * the remediation refresher) instead of relying on an AI-generated diagram.
 *
 * Returns null when the lesson has no sample figure, so callers can fall back to something else.
 */
export function LessonIntroFigure({ intro }: { intro: LessonIntroContent }) {
  if (intro.sampleMovement) {
    return <VectorIntroFigure vector={intro.sampleMovement} />
  }

  if (intro.sampleVector) {
    return (
      <div className="lesson-intro__figure">
        <CoordinatePlane min={-4} max={4}>
          <Vector
            tip={intro.sampleVector}
            color="var(--lesson-vector-a)"
            label={intro.sampleVectorLabel}
          />
        </CoordinatePlane>
      </div>
    )
  }

  if (intro.sampleHeadToTail) {
    return (
      <AdditionIntroFigure
        vectorA={intro.sampleHeadToTail.vectorA}
        vectorB={intro.sampleHeadToTail.vectorB}
      />
    )
  }

  if (intro.sampleSubtraction) {
    return (
      <SubtractionIntroFigure
        vectorA={intro.sampleSubtraction.vectorA}
        vectorB={intro.sampleSubtraction.vectorB}
      />
    )
  }

  if (intro.sampleCombination) {
    return (
      <CombinationIntroFigure
        vectorA={intro.sampleCombination.vectorA}
        vectorB={intro.sampleCombination.vectorB}
        coefA={intro.sampleCombination.coefA}
        coefB={intro.sampleCombination.coefB}
      />
    )
  }

  return null
}
