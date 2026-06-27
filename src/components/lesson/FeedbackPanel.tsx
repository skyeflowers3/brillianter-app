interface FeedbackPanelProps {
  isCorrect: boolean
  locked?: boolean
  /** When set, overrides the default incorrect/correct copy. */
  message?: string
  /**
   * While the personalized AI feedback is still generating. Shows a neutral placeholder instead of
   * the static message, so the learner never sees one message that then swaps to another.
   */
  pending?: boolean
}

export function FeedbackPanel({
  isCorrect,
  locked = false,
  message,
  pending = false,
}: FeedbackPanelProps) {
  if (pending && !isCorrect) {
    return (
      <div className="lesson-feedback lesson-feedback--pending" role="status" aria-live="polite">
        Looking at your answer…
      </div>
    )
  }

  let defaultMessage = 'Not quite. Adjust your vector and try again, or read the hint.'

  if (isCorrect) {
    defaultMessage = 'Correct!'
  } else if (locked) {
    defaultMessage = 'Not quite. Review the explanation below, then continue.'
  }

  return (
    <div
      className={`lesson-feedback ${isCorrect ? 'lesson-feedback--correct' : 'lesson-feedback--incorrect'}`}
      role="status"
    >
      {message ?? defaultMessage}
    </div>
  )
}
