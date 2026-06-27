import { getAiProvider } from './ai'
import type { AiPracticeRequest, AiPracticeResponse } from './ai/types'

/**
 * Requests parameter proposals for targeted practice questions. The AI only proposes parameters for
 * existing templates; the caller (Phase 4) builds and validates the real questions. UI/services call
 * this rather than the provider directly. Falls back to an empty proposal set on failure.
 */
export async function generatePractice(
  request: AiPracticeRequest,
): Promise<AiPracticeResponse> {
  try {
    return await getAiProvider().generatePractice(request)
  } catch (error) {
    console.warn('AI practice generation failed; using fallback.', error)
    return { proposals: [], source: 'fallback' }
  }
}
