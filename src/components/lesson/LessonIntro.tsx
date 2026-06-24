import { CoordinatePlane } from '../svg/CoordinatePlane'
import { Vector } from '../svg/Vector'
import { add, scale } from '../../lib/vectorMath'
import type { LessonIntro as LessonIntroContent } from '../../types/lesson'

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
        <div className="lesson-intro__figure">
          <CoordinatePlane min={-4} max={4}>
            <Vector
              tip={intro.sampleSubtraction.vectorA}
              color="var(--lesson-vector-a)"
              label="A"
            />
            <Vector
              tip={intro.sampleSubtraction.vectorB}
              color="var(--lesson-target)"
              label="B"
              dashed
            />
            <Vector
              tip={scale(intro.sampleSubtraction.vectorB, -1)}
              origin={intro.sampleSubtraction.vectorA}
              color="var(--lesson-vector-b)"
              label="−B"
              labelOffset={[-0.5, -1]}
            />
            <Vector
              tip={add(intro.sampleSubtraction.vectorA, scale(intro.sampleSubtraction.vectorB, -1))}
              color="var(--lesson-vector-sum)"
              label="A − B"
              labelOffset={[1, 0]}
            />
          </CoordinatePlane>
        </div>
      )}

      <div className="lesson-actions">
        <button type="button" className="button button--primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </section>
  )
}
