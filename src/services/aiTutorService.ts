import { getAiProvider } from './ai'
import { isAiEnabled } from '../lib/aiSettings'
import type { AiTutorRequest, AiTutorResponse } from './ai/types'

/**
 * Sends a tutor chat turn and returns the assistant's reply. UI components call this (never the
 * provider or the LLM directly). Returns a gentle offline prompt when AI is turned off (the widget
 * is also hidden in that case) or if the provider fails.
 */
export async function sendTutorMessage(request: AiTutorRequest): Promise<AiTutorResponse> {
  if (!isAiEnabled()) {
    return {
      reply:
        'The AI tutor is turned off. Try re-reading the prompt and breaking the problem into one small step at a time, or turn AI back on from the header.',
      source: 'fallback',
    }
  }
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
