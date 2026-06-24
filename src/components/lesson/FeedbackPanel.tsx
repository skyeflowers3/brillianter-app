interface FeedbackPanelProps {
  isCorrect: boolean
  locked?: boolean
  /** When set, overrides the default incorrect/correct copy. */
  message?: string
}

export function FeedbackPanel({
  isCorrect,
  locked = false,
  message,
}: FeedbackPanelProps) {
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
