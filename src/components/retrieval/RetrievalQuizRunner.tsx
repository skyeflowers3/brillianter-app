import { useCallback, useRef, useState } from 'react'
import { createInitialQuestionState } from '../../lib/questionState'
import { isReadyToSubmit, validateQuestion } from '../../lib/validation'
import type { Question, QuestionInteractionState } from '../../types/lesson'
import type { SkillCheckAnswer } from '../../types/progress'
import { FeedbackPanel } from '../lesson/FeedbackPanel'
import { QuestionRenderer } from '../lesson/QuestionRenderer'
import '../skillcheck/skillcheck.css'
import './retrieval.css'

interface RetrievalQuizRunnerProps {
  questions: Question[]
  /** Called once when the learner finishes the last question, with every graded answer. */
  onComplete: (answers: SkillCheckAnswer[]) => void
  /** Leave the quiz for today without finishing. The page marks today's quiz consumed. */
  onSkip: () => void
}

/**
 * Runs the daily spaced-retrieval quiz: one question at a time, submit-then-advance, ending by
 * handing every answer back to the page. Mirrors SkillCheckEngine's flow but is intentionally
 * spare — no tutor and NO hints during retrieval, since the point is unaided recall. The only
 * feedback is a minimal correct/incorrect note after each submit.
 */
export function RetrievalQuizRunner({ questions, onComplete, onSkip }: RetrievalQuizRunnerProps) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [questionState, setQuestionState] = useState<QuestionInteractionState>(() =>
    questions[0]
      ? createInitialQuestionState(questions[0])
      : { type: 'drawVector', tip: [0, 0] },
  )
  const [graded, setGraded] = useState(false)
  const [lastCorrect, setLastCorrect] = useState(false)
  const [answers, setAnswers] = useState<SkillCheckAnswer[]>([])
  const completionNotified = useRef(false)

  const currentQuestion = questions[questionIndex]
  const totalQuestions = questions.length

  const handleSubmit = useCallback(() => {
    if (!currentQuestion || graded) {
      return
    }
    const correct = validateQuestion(currentQuestion, questionState)
    setLastCorrect(correct)
    setGraded(true)
    setAnswers((current) => [...current, { questionId: currentQuestion.id, correct }])
  }, [currentQuestion, graded, questionState])

  const handleNext = useCallback(() => {
    const nextIndex = questionIndex + 1

    if (nextIndex >= totalQuestions) {
      // All answers (including the last) are recorded at submit time, so `answers` is final here.
      if (!completionNotified.current) {
        completionNotified.current = true
        onComplete(answers)
      }
      return
    }

    setQuestionIndex(nextIndex)
    setQuestionState(createInitialQuestionState(questions[nextIndex]))
    setGraded(false)
    setLastCorrect(false)
  }, [answers, onComplete, questionIndex, questions, totalQuestions])

  if (!currentQuestion) {
    return null
  }

  const readyToSubmit = isReadyToSubmit(currentQuestion, questionState)
  const isLastQuestion = questionIndex + 1 >= totalQuestions

  return (
    <section className="skillcheck">
      <header className="skillcheck__header">
        <h1 className="skillcheck__title">
          Daily Review — Question {questionIndex + 1} of {totalQuestions}
        </h1>
        <p className="skillcheck__progress">
          A quick interleaved mix from lessons you&apos;ve completed.
        </p>
      </header>

      <div className="skillcheck__prompt">
        <h2>{currentQuestion.prompt}</h2>
      </div>

      <QuestionRenderer
        key={currentQuestion.id}
        question={currentQuestion}
        state={questionState}
        onStateChange={setQuestionState}
        disabled={graded}
      />

      {graded && (
        <FeedbackPanel isCorrect={lastCorrect} message={lastCorrect ? 'Correct!' : 'Not quite.'} />
      )}

      <div className="skillcheck__actions">
        {graded ? (
          <button type="button" className="button button--primary" onClick={handleNext}>
            {isLastQuestion ? 'See results' : 'Next'}
          </button>
        ) : (
          <button
            type="button"
            className="button button--primary"
            disabled={!readyToSubmit}
            onClick={handleSubmit}
          >
            Submit answer
          </button>
        )}
        <button type="button" className="button button--secondary" onClick={onSkip}>
          Skip for today
        </button>
      </div>
    </section>
  )
}
