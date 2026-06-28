import { useMemo, useState } from 'react'
import { createInitialQuestionState } from '../../lib/questionState'
import {
  expectedVector,
  extractGuessVector,
  hasCommittedAttempt,
  isCloseGuess,
  isCorrectGuess,
} from '../../lib/pretest'
import { roundForDisplay, type Vec2 } from '../../lib/vectorMath'
import type { Question, QuestionInteractionState } from '../../types/lesson'
import type { PretestQuestion } from '../../types/pretest'
import { CoordinatePlane } from '../svg/CoordinatePlane'
import { Vector } from '../svg/Vector'
import { QuestionRenderer } from './QuestionRenderer'
import './pretest.css'

const GUESS_COLOR = 'var(--lesson-vector-b)'
const ANSWER_COLOR = 'var(--lesson-vector-sum)'
const INTRO_LINE = "Before we dive in, give this a try. You're not expected to know it yet."

interface PretestPanelProps {
  pretest: PretestQuestion
  /** Advance into the lesson (its intro figure renders next). */
  onContinue: () => void
}

/**
 * A pre-lesson "pretrieval" attempt. The learner commits one guess at a related problem, then the
 * correct answer is always revealed (drawn on the grid and labeled with its value) next to their
 * own attempt. It NEVER scores or judges: no pass/fail, no right/wrong, and it imports nothing from
 * validation.ts. The only computation is a generous closeness check that picks warm vs. neutral copy.
 */
export function PretestPanel({ pretest, onContinue }: PretestPanelProps) {
  // QuestionRenderer needs a full Question; pretests omit hint/explanation/order, so fill them in.
  const question = useMemo(() => toRenderableQuestion(pretest), [pretest])
  const [questionState, setQuestionState] = useState<QuestionInteractionState>(() =>
    createInitialQuestionState(question),
  )
  const [revealed, setRevealed] = useState(false)

  const committed = hasCommittedAttempt(question, questionState)

  let reveal = null
  if (revealed) {
    const guess = extractGuessVector(question, questionState)
    const answer = roundForDisplay(expectedVector(question))
    const correct = isCorrectGuess(question, questionState)
    const close = !correct && isCloseGuess(question, questionState, pretest.closeThreshold)
    const caption = correct
      ? pretest.reveal.correct
      : close
        ? pretest.reveal.close
        : pretest.reveal.default
    const bound = planeBound(guess, answer)

    reveal = (
      <div className="pretest__reveal">
        <CoordinatePlane min={-bound} max={bound} className="pretest__plane">
          <Vector tip={guess} color={GUESS_COLOR} label="your guess" />
          <Vector tip={answer} color={ANSWER_COLOR} label={formatVector(answer)} />
        </CoordinatePlane>

        <ul className="pretest__legend">
          <li className="pretest__legend-item">
            <span className="pretest__swatch" style={{ background: GUESS_COLOR }} aria-hidden="true" />
            Your guess
          </li>
          <li className="pretest__legend-item">
            <span className="pretest__swatch" style={{ background: ANSWER_COLOR }} aria-hidden="true" />
            Answer
          </li>
        </ul>

        <p className="pretest__caption">{caption}</p>
      </div>
    )
  }

  // The intro line, prompt, and action row stay put across both steps so the grid keeps the same
  // size and position when the learner locks in; only the middle (interaction vs. reveal) swaps.
  return (
    <section className="pretest">
      <p className="pretest__intro">{INTRO_LINE}</p>
      <h2 className="pretest__prompt">{pretest.prompt}</h2>

      {revealed ? (
        reveal
      ) : (
        <div className="pretest__attempt">
          <QuestionRenderer
            question={question}
            state={questionState}
            onStateChange={setQuestionState}
          />
        </div>
      )}

      <div className="lesson-actions">
        {revealed ? (
          <button type="button" className="button button--primary" onClick={onContinue}>
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="button button--primary"
            disabled={!committed}
            onClick={() => setRevealed(true)}
          >
            Lock in my guess
          </button>
        )}
      </div>
    </section>
  )
}

function toRenderableQuestion(pretest: PretestQuestion): Question {
  const { closeThreshold: _closeThreshold, reveal: _reveal, ...rest } = pretest
  return { ...rest, hint: '', explanation: '', order: 0 } as Question
}

function formatComponent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function formatVector([x, y]: Vec2): string {
  return `(${formatComponent(x)}, ${formatComponent(y)})`
}

/** Symmetric plane bound that fits both arrows, defaulting to the usual 8 and capped at 12. */
function planeBound(...vectors: Vec2[]): number {
  const maxComponent = Math.max(0, ...vectors.flatMap(([x, y]) => [Math.abs(x), Math.abs(y)]))
  return Math.max(8, Math.min(12, Math.ceil(maxComponent) + 1))
}
