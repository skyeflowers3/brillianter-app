import { useEffect } from 'react'
import { fireCelebration } from '../../lib/celebrate'
import { MASTERY_PRESENTATION } from '../../services/masteryService'
import type { RetrievalResultsSummary } from '../../services/retrievalQuizService'
import { getLessonMetadata } from '../../types/lessonMetadata'
import '../skillcheck/skillcheck.css'
import './retrieval.css'

interface RetrievalResultsProps {
  summary: RetrievalResultsSummary
  onBackToDashboard: () => void
}

/**
 * Daily-review results: an overall tally plus a per-lesson breakdown. Each lesson is scored on its
 * own slice of the quiz (matching how mastery is tracked), shows whether that slice passed, and
 * celebrates "Promoted to Mastered!" for any lesson this quiz tipped over the line.
 */
export function RetrievalResults({ summary, onBackToDashboard }: RetrievalResultsProps) {
  const promotedCount = summary.lessons.filter((lesson) => lesson.promotedToMastered).length
  const totalCorrect = summary.lessons.reduce((sum, lesson) => sum + lesson.questionsCorrect, 0)
  const totalPresented = summary.lessons.reduce((sum, lesson) => sum + lesson.questionsPresented, 0)

  useEffect(() => {
    if (promotedCount > 0) {
      fireCelebration('full')
    }
  }, [promotedCount])

  return (
    <section className="skillcheck-results">
      <div className="skillcheck-results__card">
        <p className="skillcheck-results__eyebrow">Daily Review complete</p>
        <p className="skillcheck-results__score">
          {totalCorrect} / {totalPresented}
        </p>
        <p className="skillcheck-results__subtitle">
          {promotedCount > 0
            ? "Your spaced practice paid off — you've locked in long-term mastery."
            : 'Showing up daily is what makes it stick. See you tomorrow!'}
        </p>
      </div>

      <div className="retrieval-outcomes">
        <h2 className="retrieval-outcomes__heading">By lesson</h2>
        <ul className="retrieval-outcomes__list">
          {summary.lessons.map((lesson) => {
            const title = getLessonMetadata(lesson.lessonId)?.title ?? lesson.lessonId
            const tier = lesson.masteryLevel
            return (
              <li key={lesson.lessonId} className="retrieval-outcome">
                <div className="retrieval-outcome__main">
                  <span className="retrieval-outcome__title">{title}</span>
                  <span className="retrieval-outcome__score">
                    {lesson.questionsCorrect}/{lesson.questionsPresented} correct
                    {' · '}
                    {lesson.passedRetrievalSession ? 'Retrieval passed' : 'Keep practicing'}
                  </span>
                </div>
                {lesson.promotedToMastered ? (
                  <span className="retrieval-outcome__badge retrieval-outcome__badge--promoted">
                    🏆 Promoted to Mastered!
                  </span>
                ) : tier ? (
                  <span className="retrieval-outcome__badge">
                    {MASTERY_PRESENTATION[tier].badge} {MASTERY_PRESENTATION[tier].label}
                  </span>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="skillcheck-results__actions">
        <button type="button" className="button button--primary" onClick={onBackToDashboard}>
          Back to dashboard
        </button>
      </div>
    </section>
  )
}
