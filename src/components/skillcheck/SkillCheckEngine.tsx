import { useCallback, useRef, useState } from 'react'
import { createInitialQuestionState } from '../../lib/questionState'
import { isReadyToSubmit, validateQuestion } from '../../lib/validation'
import type { Question, QuestionInteractionState } from '../../types/lesson'
import type { SkillCheckAnswer, SkillCheckResult } from '../../types/progress'
import { FeedbackPanel } from '../lesson/FeedbackPanel'
import { QuestionRenderer } from '../lesson/QuestionRenderer'
import { SkillCheckResults } from './SkillCheckResults'
import './skillcheck.css'

interface SkillCheckEngineProps {
  questions: Question[]
  lessonTitle: string
  onComplete: (result: SkillCheckResult) => void
  /**
   * Optional results-view handlers, forwarded to SkillCheckResults. The route component owns
   * navigation (Continue) and remounting (Retry), so it threads them through here rather than
   * the engine knowing about routing. Both are optional; a button only renders when provided.
   */
  onContinue?: () => void
  onRetry?: () => void
}

export function SkillCheckEngine({
  questions,
  lessonTitle,
  onComplete,
  onContinue,
  onRetry,
}: SkillCheckEngineProps) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [questionState, setQuestionState] = useState<QuestionInteractionState>(() =>
    questions[0]
      ? createInitialQuestionState(questions[0])
      : { type: 'drawVector', tip: [0, 0] },
  )
  const [graded, setGraded] = useState(false)
  const [lastCorrect, setLastCorrect] = useState(false)
  const [answers, setAnswers] = useState<SkillCheckAnswer[]>([])
  const [showResults, setShowResults] = useState(false)
  const completionNotified = useRef(false)

  const currentQuestion = questions[questionIndex]
  const totalQuestions = questions.length
  const score = answers.filter((answer) => answer.correct).length

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
      setShowResults(true)
      // Notify exactly once, when the results view is first reached. All answers (including the
      // last) are already recorded at submit time, so the current state is the final result.
      if (!completionNotified.current) {
        completionNotified.current = true
        onComplete({ score, total: totalQuestions, answers })
      }
      return
    }

    setQuestionIndex(nextIndex)
    setQuestionState(createInitialQuestionState(questions[nextIndex]))
    setGraded(false)
    setLastCorrect(false)
  }, [answers, onComplete, questionIndex, questions, score, totalQuestions])

  if (showResults) {
    return (
      <SkillCheckResults
        score={score}
        total={totalQuestions}
        questions={questions}
        answers={answers}
        onContinue={onContinue}
        onRetry={onRetry}
      />
    )
  }

  if (!currentQuestion) {
    return null
  }

  const readyToSubmit = isReadyToSubmit(currentQuestion, questionState)
  const isLastQuestion = questionIndex + 1 >= totalQuestions

  return (
    <section className="skillcheck">
      <header className="skillcheck__header">
        <div>
          <p className="skillcheck__eyebrow">Skill Check</p>
          <h1 className="skillcheck__title">{lessonTitle}</h1>
        </div>
        <p className="skillcheck__progress">
          Question {questionIndex + 1} of {totalQuestions}
        </p>
      </header>

      <div className="skillcheck__prompt">
        <h2>{currentQuestion.prompt}</h2>
      </div>

      {/* TODO(integration): if a literal mode="skillCheck" prop is desired on question components, main agent should thread it through QuestionRenderer. */}
      <QuestionRenderer
        key={currentQuestion.id}
        question={currentQuestion}
        state={questionState}
        onStateChange={setQuestionState}
        disabled={graded}
      />

      {graded && (
        <FeedbackPanel
          isCorrect={lastCorrect}
          message={lastCorrect ? undefined : 'Not quite.'}
        />
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
      </div>
    </section>
  )
}
