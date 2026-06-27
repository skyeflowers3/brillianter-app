import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '../../firebase'
import type {
  AiFeedbackRequest,
  AiFeedbackResponse,
  AiPracticeRequest,
  AiPracticeResponse,
  AiProvider,
  AiRequestKind,
  AiTutorRequest,
  AiTutorResponse,
} from './types'

/**
 * Routes AI requests through a single Firebase callable, `aiProxy`, which holds the OpenAI key
 * server-side (see /functions). Selected only when VITE_AI_PROVIDER=cloud; the UI still never talks
 * to OpenAI directly.
 */

interface AiProxyRequest {
  kind: AiRequestKind
  payload: unknown
}

const functions = getFunctions(app)

async function callProxy<T>(kind: AiRequestKind, payload: unknown): Promise<T> {
  const callable = httpsCallable<AiProxyRequest, T>(functions, 'aiProxy')
  const result = await callable({ kind, payload })
  return result.data
}

export const cloudAiProvider: AiProvider = {
  name: 'cloud',
  getFeedback: (request: AiFeedbackRequest) => callProxy<AiFeedbackResponse>('feedback', request),
  chat: (request: AiTutorRequest) => callProxy<AiTutorResponse>('tutor', request),
  generatePractice: (request: AiPracticeRequest) =>
    callProxy<AiPracticeResponse>('practice', request),
}
