import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import confetti from 'canvas-confetti'

interface LessonCompleteProps {
  lessonId: string
  lessonTitle: string
  totalQuestions: number
  onRetry: () => void
}

export function LessonComplete({
  lessonId,
  lessonTitle,
  totalQuestions,
  onRetry,
}: LessonCompleteProps) {
  useEffect(() => {
    const duration = 1200
    const end = Date.now() + duration
    const colors = ['#aa3bff', '#7c3aed', '#2563eb', '#15803d', '#f59e0b']

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors,
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    // Initial celebratory burst plus a short streamer from both sides.
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors })
    frame()
  }, [])

  return (
    <section className="lesson-complete">
      <div className="lesson-complete__card">
        <div className="lesson-complete__badge" aria-hidden="true">
          🎉
        </div>
        <h2 className="lesson-complete__title">Good job! You completed the lesson.</h2>
        <p className="lesson-complete__subtitle">
          You finished all {totalQuestions} questions in “{lessonTitle}”.
        </p>
        <p className="lesson-complete__note muted">
          Your progress has been saved. Ready to test what you learned?
        </p>
        <div className="lesson-actions">
          <button type="button" className="button button--secondary" onClick={onRetry}>
            Retry
          </button>
          <Link to={`/skill-check/${lessonId}`} className="button button--primary">
            Continue to skill check
          </Link>
        </div>
      </div>
    </section>
  )
}
