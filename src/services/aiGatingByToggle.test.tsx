import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setAiEnabled } from '../lib/aiSettings'

// Spy on the active provider so we can assert it is NOT called when AI is turned off.
const getFeedback = vi.fn()
const chat = vi.fn()
const generatePracticeProvider = vi.fn()

vi.mock('./ai', () => ({
  getAiProvider: () => ({
    name: 'mock',
    getFeedback,
    chat,
    generatePractice: generatePracticeProvider,
  }),
}))

import { getMistakeFeedback } from './aiFeedbackService'
import { sendTutorMessage } from './aiTutorService'
import { generatePractice } from './aiQuestionGenerator'

beforeEach(() => {
  window.localStorage.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  window.localStorage.clear()
})

const feedbackRequest = {
  questionId: 'q1',
  questionType: 'drawVector' as const,
  prompt: 'Draw (4, 3).',
  attempts: 1,
  submittedSummary: '(2, 5)',
  correctSummary: '(4, 3)',
  conceptTags: ['vectors'],
}

describe('AI off switch short-circuits every AI feature', () => {
  it('returns offline feedback without calling the provider', async () => {
    setAiEnabled(false)

    const response = await getMistakeFeedback(feedbackRequest)

    expect(getFeedback).not.toHaveBeenCalled()
    expect(response.source).toBe('fallback')
    expect(response.message).toBeTruthy()
  })

  it('returns an offline tutor reply without calling the provider', async () => {
    setAiEnabled(false)

    const response = await sendTutorMessage({ messages: [{ role: 'user', content: 'help' }] })

    expect(chat).not.toHaveBeenCalled()
    expect(response.source).toBe('fallback')
    expect(response.reply).toMatch(/turned off/i)
  })

  it('returns no AI question proposals without calling the provider', async () => {
    setAiEnabled(false)

    const response = await generatePractice({
      lessonId: 'lesson-1',
      targetConcepts: ['vectors'],
      templateQuestionIds: ['t1'],
      count: 3,
    })

    expect(generatePracticeProvider).not.toHaveBeenCalled()
    expect(response.proposals).toEqual([])
  })

  it('calls the provider again once AI is turned back on', async () => {
    getFeedback.mockResolvedValue({ message: 'ai', source: 'ai' })
    setAiEnabled(true)

    const response = await getMistakeFeedback(feedbackRequest)

    expect(getFeedback).toHaveBeenCalledTimes(1)
    expect(response.source).toBe('ai')
  })
})
