import { CoordinatePlane } from '../svg/CoordinatePlane'
import { Vector } from '../svg/Vector'
import { add } from '../../lib/vectorMath'
import type { LessonIntro as LessonIntroContent } from '../../types/lesson'
import { MovementFigure } from './MovementFigure'
import { SubtractionIntroFigure } from './SubtractionIntroFigure'
import { CombinationIntroFigure } from './CombinationIntroFigure'

interface LessonIntroProps {
  intro: LessonIntroContent
  onContinue: () => void
}

export function LessonIntro({ intro, onContinue }: LessonIntroProps) {
  return (
    <section className="lesson-intro">
      <div className="lesson-intro__body">
        {intro.paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {intro.sampleMovement && <MovementFigure destination={intro.sampleMovement} />}

      {intro.sampleVector && (
        <div className="lesson-intro__figure">
          <CoordinatePlane min={-4} max={4}>
            <Vector
              tip={intro.sampleVector}
              color="var(--lesson-vector-a)"
              label={intro.sampleVectorLabel}
            />
          </CoordinatePlane>
        </div>
      )}

      {intro.sampleHeadToTail && (
        <div className="lesson-intro__figure">
          <CoordinatePlane min={-4} max={4}>
            <Vector
              tip={intro.sampleHeadToTail.vectorA}
              color="var(--lesson-vector-a)"
              label="A"
            />
            <Vector
              tip={intro.sampleHeadToTail.vectorB}
              origin={intro.sampleHeadToTail.vectorA}
              color="var(--lesson-vector-b)"
              label="B"
            />
            <Vector
              tip={add(intro.sampleHeadToTail.vectorA, intro.sampleHeadToTail.vectorB)}
              color="var(--lesson-vector-sum)"
              label="A + B"
            />
          </CoordinatePlane>
        </div>
      )}

      {intro.sampleSubtraction && (
        <SubtractionIntroFigure
          vectorA={intro.sampleSubtraction.vectorA}
          vectorB={intro.sampleSubtraction.vectorB}
        />
      )}

      {intro.sampleCombination && (
        <CombinationIntroFigure
          vectorA={intro.sampleCombination.vectorA}
          vectorB={intro.sampleCombination.vectorB}
          coefA={intro.sampleCombination.coefA}
          coefB={intro.sampleCombination.coefB}
        />
      )}

      <div className="lesson-actions">
        <button type="button" className="button button--primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </section>
  )
}
