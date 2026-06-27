import { describe, expect, it } from 'vitest'
import { mockAiProvider } from './mockProvider'
import type { AiFeedbackRequest } from './types'

function feedbackRequest(overrides: Partial<AiFeedbackRequest>): AiFeedbackRequest {
  return {
    questionId: 'q1',
    questionType: 'readVector',
    prompt: 'What vector is shown?',
    attempts: 1,
    submittedSummary: '(2, 5)',
    correctSummary: '(5, 2)',
    ...overrides,
  }
}

describe('mockAiProvider', () => {
  it('detects swapped coordinates from structured payloads', async () => {
    const response = await mockAiProvider.getFeedback(
      feedbackRequest({ submitted: [2, 5], correct: [5, 2] }),
    )
    expect(response.source).toBe('mock')
    expect(response.message.toLowerCase()).toContain('swapped')
  })

  it('flags a wrong-sign first coordinate', async () => {
    const response = await mockAiProvider.getFeedback(
      feedbackRequest({ submittedSummary: '(3, 2)', correctSummary: '(-3, 2)', submitted: [3, 2], correct: [-3, 2] }),
    )
    expect(response.message.toLowerCase()).toContain('sign')
  })

  it('falls back to a generic message when payloads are not 2D vectors', async () => {
    const response = await mockAiProvider.getFeedback(
      feedbackRequest({ submittedSummary: 'c = 2', correctSummary: 'c = -3' }),
    )
    expect(response.message).toContain('c = -3')
  })

  it('returns a guiding tutor reply without leaking an answer', async () => {
    const response = await mockAiProvider.chat({
      messages: [{ role: 'user', content: 'why is this wrong?' }],
      context: { questionPrompt: 'Find a + b' },
    })
    expect(response.source).toBe('mock')
    expect(response.reply.length).toBeGreaterThan(0)
  })

  it('echoes up to `count` practice templates as proposals', async () => {
    const response = await mockAiProvider.generatePractice({
      lessonId: 'lesson-1',
      targetConcepts: ['negative-components'],
      templateQuestionIds: ['l1-q1', 'l1-q2', 'l1-q3'],
      count: 2,
    })
    expect(response.proposals).toHaveLength(2)
    expect(response.proposals[0].templateQuestionId).toBe('l1-q1')
  })
})
