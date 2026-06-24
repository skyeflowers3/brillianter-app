interface LessonStepperProps {
  total: number
  currentIndex: number
  /** Furthest question index reached since the last (re)start. */
  maxIndex: number
  hasIntro?: boolean
  showingIntro?: boolean
  onSelectIntro?: () => void
  onSelectQuestion: (index: number) => void
}

export function LessonStepper({
  total,
  currentIndex,
  maxIndex,
  hasIntro = false,
  showingIntro = false,
  onSelectIntro,
  onSelectQuestion,
}: LessonStepperProps) {
  const label = showingIntro ? 'Intro' : `Question ${currentIndex + 1} of ${total}`

  return (
    <div className="lesson-stepper">
      <div className="lesson-stepper__label">{label}</div>
      <nav className="lesson-stepper__steps" aria-label="Lesson navigation">
        {hasIntro && (
          <button
            type="button"
            className={`lesson-stepper__step lesson-stepper__step--intro${
              showingIntro ? ' is-current' : ''
            }`}
            aria-current={showingIntro ? 'step' : undefined}
            onClick={onSelectIntro}
          >
            Start
          </button>
        )}
        {Array.from({ length: total }, (_, index) => {
          const reached = index <= maxIndex
          const isCurrent = !showingIntro && index === currentIndex

          return (
            <button
              key={index}
              type="button"
              className={`lesson-stepper__step${isCurrent ? ' is-current' : ''}${
                reached ? '' : ' is-locked'
              }`}
              disabled={!reached}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Question ${index + 1}${reached ? '' : ' (locked)'}`}
              onClick={() => onSelectQuestion(index)}
            >
              {index + 1}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
