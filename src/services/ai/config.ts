import type { AiProviderName } from './types'

/**
 * Which AI provider the client uses. Defaults to the local `mock` so the UI works with no network
 * and no API key. Set `VITE_AI_PROVIDER=cloud` to route through the Cloud Function (OpenAI) once it
 * is deployed and the `OPENAI_API_KEY` secret is configured.
 */
export function getAiProviderName(): AiProviderName {
  return import.meta.env.VITE_AI_PROVIDER === 'cloud' ? 'cloud' : 'mock'
}
