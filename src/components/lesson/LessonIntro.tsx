import type { LessonIntro as LessonIntroContent } from '../../types/lesson'
import { LessonIntroFigure } from './LessonIntroFigure'

interface LessonIntroProps {
  intro: LessonIntroContent
  onContinue: () => void
}

export function LessonIntro({ intro, onContinue }: LessonIntroProps) {
  // Stepped figures (vector / addition / subtraction) explain each step in their own captions, so
  // the prose intro paragraphs are hidden to let the animation be the star of the show.
  const hasSteppedFigure = Boolean(
    intro.sampleMovement || intro.sampleHeadToTail || intro.sampleSubtraction,
  )

  return (
    <section className="lesson-intro">
      {!hasSteppedFigure && (
        <div className="lesson-intro__body">
          {intro.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}

      <LessonIntroFigure intro={intro} />

      <div className="lesson-actions">
        <button type="button" className="button button--primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </section>
  )
}
