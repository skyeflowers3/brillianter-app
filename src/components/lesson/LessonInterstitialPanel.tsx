import type { LessonInterstitial } from '../../types/lesson'

interface LessonInterstitialPanelProps {
  interstitial: LessonInterstitial
  onContinue: () => void
}

export function LessonInterstitialPanel({ interstitial, onContinue }: LessonInterstitialPanelProps) {
  return (
    <section className="lesson-interstitial">
      <div className="lesson-interstitial__body">
        {interstitial.heading && (
          <h2 className="lesson-interstitial__heading">{interstitial.heading}</h2>
        )}
        {interstitial.segments.map((segment, index) =>
          segment.type === 'math' ? (
            <p key={index} className="lesson-interstitial__math">
              {segment.value}
            </p>
          ) : (
            <p key={index} className="lesson-interstitial__text">
              {segment.value}
            </p>
          ),
        )}
      </div>

      <div className="lesson-actions">
        <button type="button" className="button button--primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </section>
  )
}
