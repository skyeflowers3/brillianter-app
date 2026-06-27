import { getAiProvider } from './ai'
import { describeVectorMistake } from './ai/feedbackHeuristics'
import type { AiFeedbackRequest, AiFeedbackResponse } from './ai/types'

/**
 * Personalized explanation of a specific mistake. UI components call this (never the provider or the
 * LLM directly). If the provider fails, returns a safe static fallback so feedback never breaks —
 * the fallback still uses the offline coordinate heuristics so it stays specific where it can.
 */
export async function getMistakeFeedback(
  request: AiFeedbackRequest,
): Promise<AiFeedbackResponse> {
  try {
    return await getAiProvider().getFeedback(request)
  } catch (error) {
    console.warn('AI feedback failed; using fallback.', error)
    const specific = describeVectorMistake(request.submitted, request.correct)
    return {
      message:
        specific ??
        `The correct answer is ${request.correctSummary}. Compare it with your answer (${request.submittedSummary}) and try again.`,
      diagnosedConcepts: request.conceptTags,
      source: 'fallback',
    }
  }
}
