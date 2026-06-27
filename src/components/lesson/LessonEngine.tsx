import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLessonNavigation } from '../../hooks/useLessonNavigation'
import { useTutorContext } from '../../hooks/useTutorContext'
import { buildFeedbackRequest } from '../../lib/answerSummary'
import { getMistakeFeedback } from '../../services/aiFeedbackService'
import {
  createInitialQuestionState,
  getSubmitHintMessage,
  questionStatesEqual,
  restoreQuestionState,
} from '../../lib/questionState'
import {
  getFindMagnitudeIncorrectMessage,
  getHeadToTailAddIncorrectMessage,
  getHeadToTailAddIncorrectReason,
  getIncompleteStepMessage,
  getLinearComboIncorrectMessage,
  getConstructComboIncorrectMessage,
  getMultipleChoiceIncorrectMessage,
  getNegateIncorrectMessage,
  getReadVectorIncorrectMessage,
  getScalarIncorrectMessage,
  getSubtractIncorrectMessage,
  getVectorAdditionIncorrectMessage,
  isReadyToSubmit,
  validateQuestion,
} from '../../lib/validation'
import type {
  AnsweredQuestionSnapshot,
  LessonEnginePersistHandlers,
  LessonResumeState,
} from '../../types/lessonEngine'
import type {
  LessonContent,
  LessonInterstitial,
  LessonPhase,
  QuestionInteractionState,
} from '../../types/lesson'
import type { MasteryProfile } from '../../types/masteryProfile'
import { suggestStrategy } from '../../services/strategyAdvisor'
import { describeCurrentProgress, describeSolutionSteps } from '../../lib/solutionGuide'
import { ExplanationPanel } from './ExplanationPanel'
import { FeedbackPanel } from './FeedbackPanel'
import { HintPanel } from './HintPanel'
import { LessonComplete } from './LessonComplete'
import { LessonIntro } from './LessonIntro'
import { LessonInterstitialPanel } from './LessonInterstitialPanel'
import { LessonStepper } from './LessonStepper'
import { QuestionRenderer } from './QuestionRenderer'

/** A snapshot of one question's in-session state, used for back/forward navigation. */
interface QuestionSnapshot {
  attempts: number
  phase: LessonPhase
  showHint: boolean
  showExplanation: boolean
  questionState: QuestionInteractionState
  lastSubmittedState: QuestionInteractionState | null
  hasMovedSinceSubmit: boolean
}

interface LessonEngineProps {
  lesson: LessonContent
  initialQuestionIndex?: number
  initialCompleted?: boolean
  initialResumeState?: LessonResumeState
  initialAnswers?: AnsweredQuestionSnapshot[]
  persistHandlers?: LessonEnginePersistHandlers
  /** Concept-level mastery snapshot, used to surface adaptive strategy nudges. Optional. */
  masteryProfile?: MasteryProfile | null
}

export function LessonEngine({
  lesson,
  initialQuestionIndex = 0,
  initialCompleted = false,
  initialResumeState,
  initialAnswers,
  persistHandlers,
  masteryProfile,
}: LessonEngineProps) {
  const { setLessonSession } = useLessonNavigation()
  const { setQuestionContext } = useTutorContext()
  const questions = lesson.questions
  const initialIndex = initialResumeState?.questionIndex ?? initialQuestionIndex
  const initialQuestion = questions[initialIndex]

  // If the starting question was already answered (e.g. reviewing a completed lesson), restore
  // that saved answer instead of resetting to a blank vector.
  const initialAnswerSnapshot = (initialAnswers ?? []).find(
    (answer) => answer.questionIndex === initialIndex,
  )

  const [questionIndex, setQuestionIndex] = useState(initialIndex)
  const [attempts, setAttempts] = useState(
    initialAnswerSnapshot?.attempts ?? initialResumeState?.attempts ?? 0,
  )
  const [phase, setPhase] = useState<LessonPhase>(
    initialAnswerSnapshot?.phase ?? initialResumeState?.phase ?? 'exploring',
  )
  const [showHint, setShowHint] = useState(
    initialAnswerSnapshot?.showHint ?? initialResumeState?.showHint ?? false,
  )
  const [showExplanation, setShowExplanation] = useState(
    initialAnswerSnapshot?.showExplanation ?? initialResumeState?.showExplanation ?? false,
  )
  // Question id for which the learner dismissed the adaptive strategy tip, so it stays hidden for
  // that question but can reappear on a later one where the pattern still holds.
  const [strategyDismissedFor, setStrategyDismissedFor] = useState<string | null>(null)
  // A finished lesson opens in "review" mode (start at the beginning, all questions navigable)
  // rather than jumping to the celebration card, which only shows after finishing in-session.
  const [lessonComplete, setLessonComplete] = useState(false)
  // Reviewing an already-completed lesson is read-only: moving through it (including reaching the
  // end) must never write progress, so a review can't reset a finished/mastered lesson. "Retry"
  // leaves review by resetting the lesson, after which the fresh attempt persists normally.
  const [reviewing, setReviewing] = useState(initialCompleted)
  const [showIntro, setShowIntro] = useState(
    Boolean(lesson.intro) &&
      initialIndex === 0 &&
      !initialCompleted &&
      !initialResumeState?.interactionState &&
      (initialResumeState?.phase ?? 'exploring') === 'exploring' &&
      (initialResumeState?.attempts ?? 0) === 0,
  )
  const [questionState, setQuestionState] = useState<QuestionInteractionState>(() => {
    if (initialAnswerSnapshot) {
      return initialAnswerSnapshot.interactionState
    }

    if (!initialQuestion) {
      return { type: 'drawVector', tip: [0, 0] }
    }

    return restoreQuestionState(
      initialQuestion,
      initialResumeState?.interactionState,
      initialResumeState?.tip,
    )
  })
  const [lastSubmittedState, setLastSubmittedState] = useState<QuestionInteractionState | null>(
    initialAnswerSnapshot?.interactionState ?? initialResumeState?.interactionState ?? null,
  )
  const [hasMovedSinceSubmit, setHasMovedSinceSubmit] = useState(false)
  // Personalized AI feedback for the latest wrong answer (null while loading or when unavailable).
  // It augments the static per-type message below. A monotonic seq guards against a slow earlier
  // request overwriting a newer one.
  const [aiFeedback, setAiFeedback] = useState<string | null>(null)
  // True while the AI feedback request is in flight, so the panel can show a neutral placeholder
  // instead of briefly flashing the static message and then swapping to the AI one.
  const [aiFeedbackPending, setAiFeedbackPending] = useState(false)
  const aiFeedbackSeq = useRef(0)
  // Furthest question index reached since the lesson was last (re)started.
  const [maxIndex, setMaxIndex] = useState(() => {
    // A completed lesson is fully reviewable, so every question is reachable.
    if (initialCompleted) {
      return Math.max(questions.length - 1, 0)
    }
    let furthest = initialIndex
    for (const answer of initialAnswers ?? []) {
      furthest = Math.max(furthest, answer.questionIndex)
    }
    return furthest
  })
  // Per-question in-session state, seeded from saved history so back-navigation shows prior answers.
  const [snapshots] = useState<Map<number, QuestionSnapshot>>(() => {
    const seeded = new Map<number, QuestionSnapshot>()
    for (const answer of initialAnswers ?? []) {
      seeded.set(answer.questionIndex, {
        attempts: answer.attempts,
        phase: answer.phase,
        showHint: answer.showHint,
        showExplanation: answer.showExplanation,
        questionState: answer.interactionState,
        lastSubmittedState: answer.interactionState,
        hasMovedSinceSubmit: false,
      })
    }
    return seeded
  })

  // A teaching page shown between questions (e.g. after Q3) while advancing forward.
  const interstitials = useMemo(() => lesson.interstitials ?? [], [lesson.interstitials])
  const [activeInterstitial, setActiveInterstitial] = useState<LessonInterstitial | null>(null)
  const [pendingAdvance, setPendingAdvance] = useState<
    { nextIndex: number; advancingFrontier: boolean } | null
  >(null)

  const currentQuestion = questions[questionIndex]
  const totalQuestions = questions.length

  const strategySuggestion = useMemo(
    () => suggestStrategy(currentQuestion, masteryProfile),
    [currentQuestion, masteryProfile],
  )

  // What the tutor should know about how to solve THIS question and where the learner is in it.
  // `solutionSteps` is static per question; `progressNote` re-derives from the live state but stays
  // a stable string until the learner crosses a real step boundary, so it won't churn on every drag.
  const solutionSteps = useMemo(
    () => (currentQuestion ? describeSolutionSteps(currentQuestion) : undefined),
    [currentQuestion],
  )
  const progressNote = useMemo(
    () => (currentQuestion ? describeCurrentProgress(currentQuestion, questionState) : undefined),
    [currentQuestion, questionState],
  )

  useEffect(() => {
    setLessonSession({ lessonId: lesson.lessonId, isComplete: lessonComplete })

    return () => {
      setLessonSession({ lessonId: null, isComplete: false })
    }
  }, [lesson.lessonId, lessonComplete, setLessonSession])

  // Tell the always-available tutor which question the learner is on (cleared on intro/complete/exit).
  useEffect(() => {
    if (!currentQuestion || lessonComplete || showIntro || activeInterstitial) {
      setQuestionContext(null)
      return
    }
    setQuestionContext({
      lessonId: lesson.lessonId,
      questionId: currentQuestion.id,
      questionPrompt: currentQuestion.prompt,
      currentAttempts: attempts,
      solutionSteps,
      progressNote,
    })
  }, [
    activeInterstitial,
    attempts,
    currentQuestion,
    lesson.lessonId,
    lessonComplete,
    progressNote,
    solutionSteps,
    setQuestionContext,
    showIntro,
  ])

  useEffect(() => () => setQuestionContext(null), [setQuestionContext])

  const interactionDisabled = phase === 'correct' || (phase === 'incorrect' && attempts >= 2)

  const resetQuestionState = useCallback(
    (nextIndex: number) => {
      const nextQuestion = questions[nextIndex]

      setQuestionIndex(nextIndex)
      setAttempts(0)
      setPhase('exploring')
      setShowHint(false)
      setShowExplanation(false)
      setQuestionState(createInitialQuestionState(nextQuestion))
      setLastSubmittedState(null)
      setHasMovedSinceSubmit(false)
      aiFeedbackSeq.current += 1
      setAiFeedback(null)
      setAiFeedbackPending(false)
    },
    [questions],
  )

  const captureSnapshot = useCallback(
    (): QuestionSnapshot => ({
      attempts,
      phase,
      showHint,
      showExplanation,
      questionState,
      lastSubmittedState,
      hasMovedSinceSubmit,
    }),
    [attempts, hasMovedSinceSubmit, lastSubmittedState, phase, questionState, showExplanation, showHint],
  )

  const applySnapshot = useCallback((snapshot: QuestionSnapshot) => {
    setAttempts(snapshot.attempts)
    setPhase(snapshot.phase)
    setShowHint(snapshot.showHint)
    setShowExplanation(snapshot.showExplanation)
    setQuestionState(snapshot.questionState)
    setLastSubmittedState(snapshot.lastSubmittedState)
    setHasMovedSinceSubmit(snapshot.hasMovedSinceSubmit)
    // Don't carry a previous question's AI feedback into the one we navigated to.
    aiFeedbackSeq.current += 1
    setAiFeedback(null)
    setAiFeedbackPending(false)
  }, [])

  const goToQuestion = useCallback(
    (targetIndex: number) => {
      if (targetIndex === questionIndex && !showIntro && !activeInterstitial) {
        return
      }

      // Can only revisit questions already reached this session.
      if (targetIndex > maxIndex || targetIndex < 0 || targetIndex >= questions.length) {
        return
      }

      if (!showIntro && !activeInterstitial) {
        snapshots.set(questionIndex, captureSnapshot())
      }
      setShowIntro(false)
      setActiveInterstitial(null)
      setPendingAdvance(null)

      const saved = snapshots.get(targetIndex)
      if (saved) {
        setQuestionIndex(targetIndex)
        applySnapshot(saved)
      } else {
        resetQuestionState(targetIndex)
      }
    },
    [activeInterstitial, applySnapshot, captureSnapshot, maxIndex, questionIndex, questions.length, resetQuestionState, showIntro, snapshots],
  )

  const goToBeginning = useCallback(() => {
    if (!lesson.intro || showIntro) {
      return
    }

    if (!activeInterstitial) {
      snapshots.set(questionIndex, captureSnapshot())
    }
    setActiveInterstitial(null)
    setPendingAdvance(null)
    setShowIntro(true)
  }, [activeInterstitial, captureSnapshot, lesson.intro, questionIndex, showIntro, snapshots])

  const persistQuestionResult = useCallback(
    async (wasCorrect: boolean, attemptCount: number, submittedState: QuestionInteractionState) => {
      if (!currentQuestion || !persistHandlers || reviewing) {
        return
      }

      await persistHandlers.onAnswerRecorded({
        questionId: currentQuestion.id,
        correct: wasCorrect,
        attempts: attemptCount,
        submittedState,
      })
    },
    [currentQuestion, persistHandlers, reviewing],
  )

  const requestAiFeedback = useCallback(
    (submittedState: QuestionInteractionState, attemptCount: number, hintShown: boolean) => {
      if (!currentQuestion) {
        return
      }

      const request = buildFeedbackRequest(currentQuestion, submittedState, attemptCount, hintShown)
      if (!request) {
        // No typed answer to diagnose — the static per-type message is clearer here.
        setAiFeedback(null)
        setAiFeedbackPending(false)
        return
      }

      const seq = aiFeedbackSeq.current + 1
      aiFeedbackSeq.current = seq
      setAiFeedback(null)
      setAiFeedbackPending(true)

      void getMistakeFeedback(request)
        .then((response) => {
          if (aiFeedbackSeq.current === seq) {
            setAiFeedback(response.message)
            setAiFeedbackPending(false)
          }
        })
        .catch(() => {
          // getMistakeFeedback already falls back internally; ignore unexpected errors.
          if (aiFeedbackSeq.current === seq) {
            setAiFeedbackPending(false)
          }
        })
    },
    [currentQuestion],
  )

  const handleStateChange = useCallback(
    (nextState: QuestionInteractionState) => {
      setQuestionState(nextState)

      if (
        phase === 'incorrect' &&
        attempts < 2 &&
        lastSubmittedState &&
        !questionStatesEqual(nextState, lastSubmittedState)
      ) {
        setHasMovedSinceSubmit(true)
      }
    },
    [attempts, lastSubmittedState, phase],
  )

  const handleSubmit = useCallback(async () => {
    if (!currentQuestion || interactionDisabled) {
      return
    }

    const isCorrect = validateQuestion(currentQuestion, questionState)

    if (isCorrect) {
      setPhase('correct')
      setLastSubmittedState(questionState)
      aiFeedbackSeq.current += 1
      setAiFeedback(null)
      setAiFeedbackPending(false)
      await persistQuestionResult(true, attempts + 1, questionState)
      return
    }

    const nextAttempts = attempts + 1
    setAttempts(nextAttempts)
    setPhase('incorrect')
    setLastSubmittedState(questionState)
    setHasMovedSinceSubmit(false)

    // Ask for personalized feedback on the specific wrong answer. A hint is only on screen from the
    // second attempt onward (it's revealed after the first miss).
    requestAiFeedback(questionState, nextAttempts, nextAttempts > 1)

    if (nextAttempts === 1) {
      setShowHint(true)
      return
    }

    setShowExplanation(true)
    await persistQuestionResult(false, nextAttempts, questionState)
  }, [attempts, currentQuestion, interactionDisabled, persistQuestionResult, questionState, requestAiFeedback])

  const handleWhy = useCallback(() => {
    setShowExplanation(true)
  }, [])

  const proceedToIndex = useCallback(
    (nextIndex: number, advancingFrontier: boolean) => {
      const saved = snapshots.get(nextIndex)
      if (saved && !advancingFrontier) {
        setQuestionIndex(nextIndex)
        applySnapshot(saved)
      } else {
        resetQuestionState(nextIndex)
      }
    },
    [applySnapshot, resetQuestionState, snapshots],
  )

  const handleContinue = useCallback(async () => {
    const nextIndex = questionIndex + 1
    const isLastQuestion = nextIndex >= totalQuestions
    const advancingFrontier = nextIndex > maxIndex

    // Only push the persisted frontier forward — revisiting earlier questions must not rewind it.
    // In review mode nothing is persisted at all, so re-reading a finished lesson can't reset it.
    if (persistHandlers && !reviewing && (advancingFrontier || isLastQuestion)) {
      await persistHandlers.onContinue({
        nextQuestionIndex: isLastQuestion ? questionIndex : nextIndex,
        completed: isLastQuestion,
      })
    }

    if (isLastQuestion) {
      setLessonComplete(true)
      return
    }

    snapshots.set(questionIndex, captureSnapshot())

    if (advancingFrontier) {
      setMaxIndex(nextIndex)
    }

    // Surface a teaching page before the next question, if one is defined after this question.
    const interstitial = interstitials.find((item) => item.afterQuestionId === currentQuestion?.id)
    if (interstitial) {
      setPendingAdvance({ nextIndex, advancingFrontier })
      setActiveInterstitial(interstitial)
      return
    }

    proceedToIndex(nextIndex, advancingFrontier)
  }, [
    captureSnapshot,
    currentQuestion,
    interstitials,
    maxIndex,
    persistHandlers,
    proceedToIndex,
    questionIndex,
    reviewing,
    snapshots,
    totalQuestions,
  ])

  const handleInterstitialContinue = useCallback(() => {
    if (pendingAdvance) {
      proceedToIndex(pendingAdvance.nextIndex, pendingAdvance.advancingFrontier)
    }
    setActiveInterstitial(null)
    setPendingAdvance(null)
  }, [pendingAdvance, proceedToIndex])

  const readyToSubmit = currentQuestion ? isReadyToSubmit(currentQuestion, questionState) : true
  const submitDisabled =
    !readyToSubmit || (phase === 'incorrect' && attempts < 2 && !hasMovedSinceSubmit)

  const feedbackMessage = useMemo(() => {
    if (phase === 'correct') {
      return undefined
    }

    const locked = phase === 'incorrect' && attempts >= 2

    if (
      currentQuestion?.type === 'headToTailAdd' &&
      lastSubmittedState?.type === 'headToTailAdd'
    ) {
      const reason = getHeadToTailAddIncorrectReason(
        currentQuestion.correctAnswer,
        lastSubmittedState,
      )

      if (reason) {
        return getHeadToTailAddIncorrectMessage(reason, locked)
      }
    }

    if (currentQuestion && lastSubmittedState) {
      return (
        getVectorAdditionIncorrectMessage(currentQuestion, lastSubmittedState, locked) ??
        getScalarIncorrectMessage(currentQuestion, lastSubmittedState, locked) ??
        getMultipleChoiceIncorrectMessage(currentQuestion, lastSubmittedState, locked) ??
        getNegateIncorrectMessage(currentQuestion, lastSubmittedState, locked) ??
        getSubtractIncorrectMessage(currentQuestion, lastSubmittedState, locked) ??
        getLinearComboIncorrectMessage(currentQuestion, lastSubmittedState, locked) ??
        getConstructComboIncorrectMessage(currentQuestion, lastSubmittedState, locked) ??
        getReadVectorIncorrectMessage(currentQuestion, lastSubmittedState, locked) ??
        getFindMagnitudeIncorrectMessage(currentQuestion, lastSubmittedState, locked)
      )
    }

    return undefined
  }, [attempts, currentQuestion, phase, lastSubmittedState])

  const handleRetryLesson = useCallback(async () => {
    if (persistHandlers) {
      await persistHandlers.onLessonReset()
    }

    setReviewing(false)
    setLessonComplete(false)
    snapshots.clear()
    setMaxIndex(0)
    setActiveInterstitial(null)
    setPendingAdvance(null)
    resetQuestionState(0)
    setShowIntro(Boolean(lesson.intro))
  }, [lesson.intro, persistHandlers, resetQuestionState, snapshots])

  const actionButtons = useMemo(() => {
    if (lessonComplete || !currentQuestion) {
      return null
    }

    if (phase === 'correct') {
      return (
        <div className="lesson-actions">
          <button type="button" className="button button--secondary" onClick={handleWhy}>
            Why?
          </button>
          <button type="button" className="button button--primary" onClick={() => void handleContinue()}>
            Continue
          </button>
        </div>
      )
    }

    if (phase === 'incorrect' && attempts >= 2) {
      return (
        <div className="lesson-actions">
          <button type="button" className="button button--primary" onClick={() => void handleContinue()}>
            Continue
          </button>
        </div>
      )
    }

    return (
      <div className="lesson-actions">
        {(phase === 'exploring' || (phase === 'incorrect' && attempts < 2)) && (
          <button
            type="button"
            className="button button--primary"
            disabled={submitDisabled}
            onClick={() => void handleSubmit()}
          >
            Submit answer
          </button>
        )}
      </div>
    )
  }, [
    attempts,
    currentQuestion,
    handleContinue,
    handleSubmit,
    handleWhy,
    lessonComplete,
    phase,
    submitDisabled,
  ])

  if (lessonComplete) {
    return (
      <LessonComplete
        lessonId={lesson.lessonId}
        lessonTitle={lesson.title}
        totalQuestions={totalQuestions}
        onRetry={() => void handleRetryLesson()}
      />
    )
  }

  if (showIntro && lesson.intro) {
    return (
      <section className="lesson-engine">
        <header className="lesson-engine__header">
          <div>
            <p className="lesson-engine__topic">{lesson.topic}</p>
            <h1 className="lesson-engine__title">{lesson.title}</h1>
          </div>
          <LessonStepper
            total={totalQuestions}
            currentIndex={questionIndex}
            maxIndex={maxIndex}
            hasIntro
            showingIntro
            onSelectIntro={goToBeginning}
            onSelectQuestion={goToQuestion}
          />
        </header>
        <LessonIntro intro={lesson.intro} onContinue={() => setShowIntro(false)} />
      </section>
    )
  }

  if (activeInterstitial) {
    return (
      <section className="lesson-engine">
        <header className="lesson-engine__header">
          <div>
            <p className="lesson-engine__topic">{lesson.topic}</p>
            <h1 className="lesson-engine__title">{lesson.title}</h1>
          </div>
          <LessonStepper
            total={totalQuestions}
            currentIndex={questionIndex}
            maxIndex={maxIndex}
            hasIntro={Boolean(lesson.intro)}
            onSelectIntro={goToBeginning}
            onSelectQuestion={goToQuestion}
          />
        </header>
        <LessonInterstitialPanel
          interstitial={activeInterstitial}
          onContinue={handleInterstitialContinue}
        />
      </section>
    )
  }

  if (!currentQuestion) {
    return null
  }

  return (
    <section className="lesson-engine">
      <header className="lesson-engine__header">
        <div>
          <p className="lesson-engine__topic">{lesson.topic}</p>
          <h1 className="lesson-engine__title">{lesson.title}</h1>
        </div>
        <LessonStepper
          total={totalQuestions}
          currentIndex={questionIndex}
          maxIndex={maxIndex}
          hasIntro={Boolean(lesson.intro)}
          onSelectIntro={goToBeginning}
          onSelectQuestion={goToQuestion}
        />
      </header>

      <div className="lesson-engine__prompt">
        <h2>{currentQuestion.prompt}</h2>
      </div>

      {strategySuggestion &&
        phase !== 'correct' &&
        attempts < 2 &&
        strategyDismissedFor !== currentQuestion.id && (
          <div className="strategy-tip" role="note">
            <span className="strategy-tip__icon" aria-hidden="true">
              💡
            </span>
            <p className="strategy-tip__text">{strategySuggestion.message}</p>
            <button
              type="button"
              className="strategy-tip__dismiss"
              aria-label="Dismiss suggestion"
              onClick={() => setStrategyDismissedFor(currentQuestion.id)}
            >
              ×
            </button>
          </div>
        )}

      <QuestionRenderer
        key={currentQuestion.id}
        question={currentQuestion}
        state={questionState}
        onStateChange={handleStateChange}
        disabled={interactionDisabled}
      />

      {phase !== 'exploring' && (
        <FeedbackPanel
          isCorrect={phase === 'correct'}
          locked={phase === 'incorrect' && attempts >= 2}
          pending={phase === 'incorrect' && aiFeedbackPending && !aiFeedback}
          message={
            phase === 'incorrect'
              ? // While the AI reply is generating, show nothing (the pending placeholder covers it)
                // so the static message never flashes and then swaps to the AI one.
                (aiFeedback ?? (aiFeedbackPending ? undefined : feedbackMessage))
              : feedbackMessage
          }
        />
      )}
      {showHint && <HintPanel hint={currentQuestion.hint} />}
      {showExplanation && <ExplanationPanel explanation={currentQuestion.explanation} />}

      {actionButtons}
      {submitDisabled && (phase === 'exploring' || (phase === 'incorrect' && attempts < 2)) && (
        <p className="lesson-submit-hint">
          {!readyToSubmit
            ? getIncompleteStepMessage(currentQuestion, questionState)
            : getSubmitHintMessage(questionState)}
        </p>
      )}
    </section>
  )
}
