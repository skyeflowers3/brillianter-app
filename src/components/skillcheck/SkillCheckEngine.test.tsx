import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SkillCheckEngine } from './SkillCheckEngine'
import type { MultipleChoiceQuestion } from '../../types/lesson'

function mcQuestion(
  id: string,
  prompt: string,
  correctId: string,
  explanation: string,
): MultipleChoiceQuestion {
  return {
    id,
    type: 'multipleChoice',
    prompt,
    options: [
      { id: 'opt-correct', label: `${prompt} — right` },
      { id: 'opt-wrong', label: `${prompt} — wrong` },
    ],
    correctAnswer: { type: 'multipleChoice', correctOptionIds: [correctId] },
    hint: `hint for ${id}`,
    explanation,
    order: 0,
  }
}

const Q1_EXPLANATION = 'Q1 explanation: a scalar multiple keeps the same direction.'

function buildQuestions(): MultipleChoiceQuestion[] {
  return [
    mcQuestion('q1', 'Question one', 'opt-correct', Q1_EXPLANATION),
    mcQuestion('q2', 'Question two', 'opt-correct', 'Q2 explanation.'),
    mcQuestion('q3', 'Question three', 'opt-correct', 'Q3 explanation.'),
  ]
}

describe('SkillCheckEngine', () => {
  it('never renders a hint button or hint text', () => {
    render(
      <SkillCheckEngine
        questions={buildQuestions()}
        lessonTitle="Scalars"
        onComplete={vi.fn()}
      />,
    )
    expect(screen.queryByText(/hint/i)).toBeNull()
  })

  it('keeps submit disabled until an option is selected, then enables it', async () => {
    const user = userEvent.setup()
    render(
      <SkillCheckEngine
        questions={buildQuestions()}
        lessonTitle="Scalars"
        onComplete={vi.fn()}
      />,
    )

    const submit = screen.getByRole('button', { name: /submit answer/i })
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Question one — right' }))
    expect(screen.getByRole('button', { name: /submit answer/i })).toBeEnabled()
  })

  it('locks the question after a wrong submit without inline explanation', async () => {
    const user = userEvent.setup()
    render(
      <SkillCheckEngine
        questions={buildQuestions()}
        lessonTitle="Scalars"
        onComplete={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Question one — wrong' }))
    await user.click(screen.getByRole('button', { name: /submit answer/i }))

    expect(screen.getByText('Not quite.')).toBeInTheDocument()
    // The question is locked: Submit is gone, replaced by a Next button.
    expect(screen.queryByRole('button', { name: /submit answer/i })).toBeNull()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    // Explanations only appear in the final review, never inline during the check.
    expect(screen.queryByText(Q1_EXPLANATION)).toBeNull()
  })

  it('scores the run, calls onComplete once, and reviews missed questions', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(
      <SkillCheckEngine
        questions={buildQuestions()}
        lessonTitle="Scalars"
        onComplete={onComplete}
      />,
    )

    // Q1: answer wrong.
    await user.click(screen.getByRole('button', { name: 'Question one — wrong' }))
    await user.click(screen.getByRole('button', { name: /submit answer/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Q2: answer right.
    await user.click(screen.getByRole('button', { name: 'Question two — right' }))
    await user.click(screen.getByRole('button', { name: /submit answer/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))

    // Q3: answer right, then see results.
    await user.click(screen.getByRole('button', { name: 'Question three — right' }))
    await user.click(screen.getByRole('button', { name: /submit answer/i }))
    await user.click(screen.getByRole('button', { name: /see results/i }))

    expect(screen.getByText(/scored 2 \/ 3/i)).toBeInTheDocument()

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith({
      score: 2,
      total: 3,
      answers: [
        { questionId: 'q1', correct: false },
        { questionId: 'q2', correct: true },
        { questionId: 'q3', correct: true },
      ],
    })

    // The review panel surfaces the missed question's explanation.
    expect(screen.getByText(Q1_EXPLANATION)).toBeInTheDocument()
  })
})
