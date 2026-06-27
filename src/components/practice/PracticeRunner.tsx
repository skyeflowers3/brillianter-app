import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createInitialQuestionState } from '../../lib/questionState'
import { buildFeedbackRequest } from '../../lib/answerSummary'
import { describeCurrentProgress, describeSolutionSteps } from '../../lib/solutionGuide'
import { useTutorContext } from '../../hooks/useTutorContext'
import { sendTutorMessage } from '../../services/aiTutorService'
import { getLessonMetadata } from '../../types/lessonMetadata'
import type { TutorDiagram as TutorDiagramSpec } from '../../services/ai/types'
import { TutorDiagram } from '../tutor/TutorDiagram'
import {
  getConstructComboIncorrectMessage,
  getFindMagnitudeIncorrectMessage,
  getLinearComboIncorrectMessage,
  getMultipleChoiceIncorrectMessage,
  getNegateIncorrectMessage,
  getReadVectorIncorrectMessage,
  getScalarIncorrectMessage,
  getSubtractIncorrectMessage,
  getVectorAdditionIncorrectMessage,
  isReadyToSubmit,
  validateQuestion,
} from '../../lib/validation'
import { getMistakeFeedback } from '../../services/aiFeedbackService'
import type { Question, QuestionInteractionState, LessonPhase } from '../../types/lesson'
import type { SkillCheckAnswer } from '../../types/progress'
import { FeedbackPanel } from '../lesson/FeedbackPanel'
import { HintPanel } from '../lesson/HintPanel'
import { ExplanationPanel } from '../lesson/ExplanationPanel'
import { QuestionRenderer } from '../lesson/QuestionRenderer'

interface PracticeRunnerProps {
  questions: Question[]
  /** Lesson being reviewed — lets the tutor stay context-aware during practice. */
  lessonId?: string
  /** Called once with the final per-question outcomes when the session finishes. */
  onComplete: (answers: SkillCheckAnswer[]) => void
}

interface ProactiveTip {
  /** Which question this tip belongs to, so a stale tip never shows on the next problem. */
  questionId: string
  text: string
  diagram?: TutorDiagramSpec
}

/**
 * A lightweight, guided practice session. Like the lesson engine it gives one retry with a hint then
 * reveals the explanation, and surfaces personalized AI feedback on a wrong answer — but it persists
 * nothing itself: it just reports the final outcome of each question so the caller can update the
 * mastery profile and unlock the lesson. Used by the remediation flow and Improve Mastery.
 */
export function PracticeRunner({ questions, lessonId, onComplete }: PracticeRunnerProps) {
  const { setQuestionContext } = useTutorContext()
  const [index, setIndex] = useState(0)
  const [questionState, setQuestionState] = useState<QuestionInteractionState>(() =>
    questions[0] ? createInitialQuestionState(questions[0]) : { type: 'drawVector', tip: [0, 0] },
  )
  const [phase, setPhase] = useState<LessonPhase>('exploring')
  const [attempts, setAttempts] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [lastSubmittedState, setLastSubmittedState] = useState<QuestionInteractionState | null>(null)
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)
  const [aiFeedbackPending, setAiFeedbackPending] = useState(false)
  const [tip, setTip] = useState<ProactiveTip | null>(null)
  const [dismissedTipFor, setDismissedTipFor] = useState<string | null>(null)
  const aiSeq = useRef(0)
  const tipSeq = useRef(0)
  const answers = useRef<SkillCheckAnswer[]>([])

  const current = questions[index]
  const total = questions.length
  const locked = phase === 'incorrect' && attempts >= 2
  const interactionDisabled = phase === 'correct' || locked

  // Keep the always-available tutor aware of the current practice problem and where the learner is.
  useEffect(() => {
    if (!current) {
      setQuestionContext(null)
      return
    }
    setQuestionContext({
      lessonId,
      questionId: current.id,
      questionPrompt: current.prompt,
      currentAttempts: attempts,
      solutionSteps: describeSolutionSteps(current),
      progressNote: describeCurrentProgress(current, questionState),
    })
  }, [attempts, current, lessonId, questionState, setQuestionContext])

  useEffect(() => () => setQuestionContext(null), [setQuestionContext])

  // Unprompted: when a new practice problem appears, fetch a short starting tip from the tutor. The
  // tip is tagged with its question id and only rendered for the matching question, so we never have
  // to synchronously clear state here (a stale tip simply isn't shown on the next problem).
  useEffect(() => {
    const questionId = current?.id
    if (!questionId) {
      return
    }
    const seq = tipSeq.current + 1
    tipSeq.current = seq

    const lessonTitle = lessonId ? getLessonMetadata(lessonId)?.title : undefined
    void sendTutorMessage({
      messages: [
        {
          role: 'user',
          content:
            'Give me one short tip to get started on this problem. No spoilers and do not give the ' +
            'final answer — just point me at the first step in words.',
        },
      ],
      context: {
        lessonId,
        lessonTitle,
        questionPrompt: current.prompt,
        solutionSteps: describeSolutionSteps(current),
      },
    })
      .then((response) => {
        if (tipSeq.current === seq && (response.reply || response.diagram)) {
          setTip({ questionId, text: response.reply, diagram: response.diagram })
        }
      })
      .catch(() => {
        // Tips are best-effort; the practice problem works fine without one.
      })
    // Only refetch when the actual problem changes, not on every keystroke/drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, lessonId])

  const recordOutcome = useCallback((questionId: string, correct: boolean) => {
    answers.current = [...answers.current, { questionId, correct }]
  }, [])

  const requestAiFeedback = useCallback(
    (submitted: QuestionInteractionState, attemptCount: number) => {
      if (!current) {
        return
      }
      const request = buildFeedbackRequest(current, submitted, attemptCount, attemptCount > 1)
      if (!request) {
        setAiFeedback(null)
        setAiFeedbackPending(false)
        return
      }
      const seq = aiSeq.current + 1
      aiSeq.current = seq
      setAiFeedback(null)
      setAiFeedbackPending(true)
      void getMistakeFeedback(request)
        .then((response) => {
          if (aiSeq.current === seq) {
            setAiFeedback(response.message)
            setAiFeedbackPending(false)
          }
        })
        .catch(() => {
          if (aiSeq.current === seq) {
            setAiFeedbackPending(false)
          }
        })
    },
    [current],
  )

  const handleSubmit = useCallback(() => {
    if (!current || interactionDisabled) {
      return
    }
    const correct = validateQuestion(current, questionState)
    setLastSubmittedState(questionState)

    if (correct) {
      setPhase('correct')
      aiSeq.current += 1
      setAiFeedback(null)
      setAiFeedbackPending(false)
      recordOutcome(current.id, true)
      return
    }

    const nextAttempts = attempts + 1
    setAttempts(nextAttempts)
    setPhase('incorrect')
    requestAiFeedback(questionState, nextAttempts)

    if (nextAttempts === 1) {
      setShowHint(true)
      return
    }
    setShowExplanation(true)
    recordOutcome(current.id, false)
  }, [attempts, current, interactionDisabled, questionState, recordOutcome, requestAiFeedback])

  const handleContinue = useCallback(() => {
    const nextIndex = index + 1
    if (nextIndex >= total) {
      onComplete(answers.current)
      return
    }
    setIndex(nextIndex)
    setQuestionState(createInitialQuestionState(questions[nextIndex]))
    setPhase('exploring')
    setAttempts(0)
    setShowHint(false)
    setShowExplanation(false)
    setLastSubmittedState(null)
    aiSeq.current += 1
    setAiFeedback(null)
    setAiFeedbackPending(false)
  }, [index, onComplete, questions, total])

  const staticMessage = useMemo(() => {
    if (phase !== 'incorrect' || !current || !lastSubmittedState) {
      return undefined
    }
    return (
      getVectorAdditionIncorrectMessage(current, lastSubmittedState, locked) ??
      getScalarIncorrectMessage(current, lastSubmittedState, locked) ??
      getMultipleChoiceIncorrectMessage(current, lastSubmittedState, locked) ??
      getNegateIncorrectMessage(current, lastSubmittedState, locked) ??
      getSubtractIncorrectMessage(current, lastSubmittedState, locked) ??
      getLinearComboIncorrectMessage(current, lastSubmittedState, locked) ??
      getConstructComboIncorrectMessage(current, lastSubmittedState, locked) ??
      getReadVectorIncorrectMessage(current, lastSubmittedState, locked) ??
      getFindMagnitudeIncorrectMessage(current, lastSubmittedState, locked)
    )
  }, [current, lastSubmittedState, locked, phase])

  if (!current) {
    return null
  }

  const readyToSubmit = isReadyToSubmit(current, questionState)
  const canContinue = phase === 'correct' || locked
  const isLast = index + 1 >= total

  return (
    <section className="practice-runner">
      <p className="practice-runner__progress">
        Practice {index + 1} of {total}
      </p>
      <div className="practice-runner__prompt">
        <h2>{current.prompt}</h2>
      </div>

      {tip && tip.questionId === current.id && dismissedTipFor !== current.id && (
        <div className="tutor-tip" role="note">
          <div className="tutor-tip__head">
            <span className="tutor-tip__label">Tutor tip</span>
            <button
              type="button"
              className="tutor-tip__dismiss"
              aria-label="Dismiss tip"
              onClick={() => setDismissedTipFor(current.id)}
            >
              ×
            </button>
          </div>
          {tip.text && <p className="tutor-tip__text">{tip.text}</p>}
          {tip.diagram && <TutorDiagram diagram={tip.diagram} />}
        </div>
      )}

      <QuestionRenderer
        key={current.id}
        question={current}
        state={questionState}
        onStateChange={setQuestionState}
        disabled={interactionDisabled}
      />

      {phase !== 'exploring' && (
        <FeedbackPanel
          isCorrect={phase === 'correct'}
          locked={locked}
          pending={phase === 'incorrect' && aiFeedbackPending && !aiFeedback}
          message={
            phase === 'incorrect'
              ? (aiFeedback ?? (aiFeedbackPending ? undefined : staticMessage))
              : undefined
          }
        />
      )}
      {showHint && <HintPanel hint={current.hint} />}
      {showExplanation && <ExplanationPanel explanation={current.explanation} />}

      <div className="lesson-actions">
        {canContinue ? (
          <button type="button" className="button button--primary" onClick={handleContinue}>
            {isLast ? 'Finish practice' : 'Continue'}
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
