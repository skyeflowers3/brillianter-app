import { getAiProviderName } from './config'
import { mockAiProvider } from './mockProvider'
import { cloudAiProvider } from './cloudProvider'
import type { AiProvider } from './types'

/** Returns the active AI provider based on configuration (mock by default). */
export function getAiProvider(): AiProvider {
  return getAiProviderName() === 'cloud' ? cloudAiProvider : mockAiProvider
}

export * from './types'
