import type {
  AiFeedbackRequest,
  AiFeedbackResponse,
  AiPracticeRequest,
  AiPracticeResponse,
  AiProvider,
  AiTutorRequest,
  AiTutorResponse,
} from './types'
import { describeVectorMistake } from './feedbackHeuristics'

/**
 * Local, deterministic stand-in for the real model. It contains no network calls and no API key, so
 * the entire AI UI can be built and tested before the Cloud Function is wired up. Where it can, it
 * produces plausibly-personalized output (e.g. detecting swapped coordinates) so demos feel real;
 * otherwise it falls back to clear, generic guidance.
 */

export const mockAiProvider: AiProvider = {
  name: 'mock',

  async getFeedback(request: AiFeedbackRequest): Promise<AiFeedbackResponse> {
    const specific = describeVectorMistake(request.submitted, request.correct)
    const message =
      specific ??
      `Not quite. You answered ${request.submittedSummary}, but the correct answer is ${request.correctSummary}. Walk through it one step at a time.`
    return {
      message,
      diagnosedConcepts: request.conceptTags,
      source: 'mock',
    }
  },

  async chat(request: AiTutorRequest): Promise<AiTutorResponse> {
    const lastUser = [...request.messages].reverse().find((turn) => turn.role === 'user')
    const focus = request.context?.questionPrompt
      ? ` For this problem ("${request.context.questionPrompt}"), start from what each number in the vector means.`
      : ''
    const reply = lastUser
      ? `Good question. Let's think it through together rather than jumping to the answer.${focus} What part feels unclear so far?`
      : `Hi! I'm your tutor. Ask me anything about what you're working on and I'll help you reason through it.`
    return { reply, source: 'mock' }
  },

  async generatePractice(request: AiPracticeRequest): Promise<AiPracticeResponse> {
    // The mock doesn't fabricate parameters (real, validated generation lands in Phase 4). It simply
    // echoes the candidate templates so callers can exercise the contract end to end.
    const proposals = request.templateQuestionIds
      .slice(0, Math.max(0, request.count))
      .map((templateQuestionId) => ({ templateQuestionId, parameters: {} }))
    return { proposals, source: 'mock' }
  },
}
