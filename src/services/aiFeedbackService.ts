import { getAiProvider } from './ai'
import { describeVectorMistake } from './ai/feedbackHeuristics'
import { isAiEnabled } from '../lib/aiSettings'
import type { AiFeedbackRequest, AiFeedbackResponse } from './ai/types'

/** Offline feedback used when AI is turned off or the provider fails — specific where it can be. */
function fallbackFeedback(request: AiFeedbackRequest): AiFeedbackResponse {
  const specific = describeVectorMistake(request.submitted, request.correct)
  return {
    message:
      specific ??
      `The correct answer is ${request.correctSummary}. Compare it with your answer (${request.submittedSummary}) and try again.`,
    diagnosedConcepts: request.conceptTags,
    source: 'fallback',
  }
}

/**
 * Personalized explanation of a specific mistake. UI components call this (never the provider or the
 * LLM directly). Returns the offline fallback when AI is turned off, or if the provider fails, so
 * feedback never breaks — the fallback still uses the coordinate heuristics to stay specific.
 */
export async function getMistakeFeedback(
  request: AiFeedbackRequest,
): Promise<AiFeedbackResponse> {
  if (!isAiEnabled()) {
    return fallbackFeedback(request)
  }
  try {
    return await getAiProvider().getFeedback(request)
  } catch (error) {
    console.warn('AI feedback failed; using fallback.', error)
    return fallbackFeedback(request)
  }
}
