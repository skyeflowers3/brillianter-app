import { getAiProvider } from './ai'
import type { AiTutorRequest, AiTutorResponse } from './ai/types'

/**
 * Sends a tutor chat turn and returns the assistant's reply. UI components call this (never the
 * provider or the LLM directly). Falls back to a gentle prompt if the provider fails.
 */
export async function sendTutorMessage(request: AiTutorRequest): Promise<AiTutorResponse> {
  try {
    return await getAiProvider().chat(request)
  } catch (error) {
    console.warn('AI tutor failed; using fallback.', error)
    return {
      reply:
        "I'm having trouble reaching the tutor right now. In the meantime, try re-reading the prompt and breaking the problem into one small step at a time.",
      source: 'fallback',
    }
  }
}
