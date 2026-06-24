import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LessonEngine } from './LessonEngine'
import { LessonNavigationContext } from '../../context/lesson-navigation-context'
import type { LessonContent } from '../../types/lesson'

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
