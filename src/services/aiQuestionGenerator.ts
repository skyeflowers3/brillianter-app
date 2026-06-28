import { getAiProvider } from './ai'
import { isAiEnabled } from '../lib/aiSettings'
import type { AiPracticeRequest, AiPracticeResponse } from './ai/types'

/**
 * Requests parameter proposals for targeted practice questions. The AI only proposes parameters for
 * existing templates; the caller builds and validates the real questions locally. UI/services call
 * this rather than the provider directly. Returns an empty proposal set when AI is turned off (the
 * caller then varies templates locally) or if the provider fails.
 */
export async function generatePractice(
  request: AiPracticeRequest,
): Promise<AiPracticeResponse> {
  if (!isAiEnabled()) {
    return { proposals: [], source: 'fallback' }
  }
  try {
    return await getAiProvider().generatePractice(request)
  } catch (error) {
    console.warn('AI practice generation failed; using fallback.', error)
    return { proposals: [], source: 'fallback' }
  }
}
