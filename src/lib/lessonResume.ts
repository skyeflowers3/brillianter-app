import type { LessonContent } from '../types/lesson'
import type { LessonProgress, QuestionHistoryEntry } from '../types/progress'
import type { AnsweredQuestionSnapshot, LessonResumeState } from '../types/lessonEngine'
import { restoreQuestionState } from './questionState'

export function buildLessonResumeState(
  lesson: LessonContent,
  progress: LessonProgress,
): LessonResumeState {
  const questionIndex = progress.completed ? 0 : progress.currentQuestionIndex

  if (!progress.awaitingContinue || progress.completed) {
    return {
      questionIndex,
      phase: 'exploring',
      attempts: 0,
      showHint: false,
      showExplanation: false,
    }
  }

  const currentQuestion = lesson.questions[questionIndex]
  const lastEntry = progress.questionHistory.at(-1)

  if (!currentQuestion || !lastEntry || lastEntry.questionId !== currentQuestion.id) {
    return {
      questionIndex,
      phase: 'exploring',
      attempts: 0,
      showHint: false,
      showExplanation: false,
    }
  }

  const interactionState = restoreQuestionState(
    currentQuestion,
    lastEntry.submittedState,
    lastEntry.submittedTip,
  )

  if (lastEntry.correct) {
    return {
      questionIndex,
      phase: 'correct',
      attempts: Math.max(lastEntry.attempts - 1, 0),
      showHint: false,
      showExplanation: false,
      interactionState,
    }
  }

  return {
    questionIndex,
    phase: 'incorrect',
    attempts: lastEntry.attempts,
    showHint: true,
    showExplanation: true,
    interactionState,
  }
}

/**
 * Reconstruct each already-answered question from saved history so the learner can
 * navigate back to earlier questions and still see the answer they gave.
 */
export function buildAnsweredSnapshots(
  lesson: LessonContent,
  progress: LessonProgress,
): AnsweredQuestionSnapshot[] {
  const latestByQuestionId = new Map<string, QuestionHistoryEntry>()
  for (const entry of progress.questionHistory) {
    latestByQuestionId.set(entry.questionId, entry)
  }

  const snapshots: AnsweredQuestionSnapshot[] = []

  lesson.questions.forEach((question, index) => {
    const entry = latestByQuestionId.get(question.id)
    if (!entry) {
      return
    }

    const interactionState = restoreQuestionState(
      question,
      entry.submittedState,
      entry.submittedTip,
    )

    if (entry.correct) {
      snapshots.push({
        questionIndex: index,
        phase: 'correct',
        attempts: Math.max(entry.attempts - 1, 0),
        showHint: false,
        showExplanation: false,
        interactionState,
      })
    } else {
      snapshots.push({
        questionIndex: index,
        phase: 'incorrect',
        attempts: entry.attempts,
        showHint: true,
        showExplanation: true,
        interactionState,
      })
    }
  })

  return snapshots
}
