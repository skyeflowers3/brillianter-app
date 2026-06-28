import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LessonEngine } from './LessonEngine'
import { LessonNavigationContext } from '../../context/lesson-navigation-context'
import type { LessonContent } from '../../types/lesson'
import type { PretestQuestion } from '../../types/pretest'
import lesson2Pretest from '../../content/questions/lesson-2-pretest.json'

// LessonEngine reads the LessonNavigationContext (via useLessonNavigation) and calls
// setLessonSession in an effect; we provide a minimal no-op context so the engine mounts
// without the full provider tree. We do NOT modify LessonEngine to make it testable.
const navValue = {
  isMidLesson: false,
  isLeaveDialogOpen: false,
  requestDashboardNavigation: vi.fn(),
  confirmLeaveLesson: vi.fn(),
  cancelLeaveLesson: vi.fn(),
  setLessonSession: vi.fn(),
}

const lesson: LessonContent = {
  lessonId: 'lesson-test',
  title: 'Test Lesson',
  topic: 'Scalars',
  questions: [
    {
      id: 'lq1',
      type: 'multipleChoice',
      prompt: 'Which vector is a multiple of A?',
      options: [
        { id: 'a', label: 'Vector A doubled' },
        { id: 'b', label: 'Unrelated vector' },
      ],
      correctAnswer: { type: 'multipleChoice', correctOptionIds: ['a'] },
      hint: 'Look for the same direction.',
      explanation: 'A scalar multiple keeps the same direction.',
      order: 0,
    },
  ],
}

describe('LessonEngine (light)', () => {
  it('renders the lesson prompt and a Submit button', () => {
    render(
      <MemoryRouter>
        <LessonNavigationContext.Provider value={navValue}>
          <LessonEngine lesson={lesson} />
        </LessonNavigationContext.Provider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Which vector is a multiple of A?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit answer/i })).toBeInTheDocument()
    // Contrast with the skill check: the lesson surfaces the topic header.
    expect(screen.getByText('Scalars')).toBeInTheDocument()
  })
})

const pretest = lesson2Pretest as unknown as PretestQuestion

const PRETEST_INTRO = "Before we dive in, give this a try. You're not expected to know it yet."

const introLesson: LessonContent = {
  lessonId: 'lesson-2',
  title: 'Vector Addition',
  topic: 'Vectors',
  intro: { title: 'Adding vectors', paragraphs: ['Lay them head to tail.'] },
  questions: lesson.questions,
}

function renderEngine(props: Partial<Parameters<typeof LessonEngine>[0]>) {
  return render(
    <MemoryRouter>
      <LessonNavigationContext.Provider value={navValue}>
        <LessonEngine lesson={introLesson} pretest={pretest} {...props} />
      </LessonNavigationContext.Provider>
    </MemoryRouter>,
  )
}

describe('LessonEngine pretest gate', () => {
  it('shows the pretest before the intro when it has not been seen yet', () => {
    renderEngine({ pretestSeen: false })

    expect(screen.getByText(PRETEST_INTRO)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lock in my guess' })).toBeInTheDocument()
    // The intro figure is gated behind the pretest, so it is not on screen yet.
    expect(screen.queryByText('Lay them head to tail.')).not.toBeInTheDocument()
  })

  it('skips straight to the intro once the pretest has been seen (shows once per lesson)', () => {
    renderEngine({ pretestSeen: true })

    expect(screen.queryByText(PRETEST_INTRO)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lock in my guess' })).not.toBeInTheDocument()
    expect(screen.getByText('Lay them head to tail.')).toBeInTheDocument()
  })

  it('marks the pretest seen and advances to the intro after the learner finishes it', () => {
    const onPretestSeen = vi.fn()
    renderEngine({ pretestSeen: false, onPretestSeen })

    fireEvent.change(screen.getByLabelText('a + b x component'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('a + b y component'), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lock in my guess' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(onPretestSeen).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Lay them head to tail.')).toBeInTheDocument()
  })
})
