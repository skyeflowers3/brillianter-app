import { useSyncExternalStore } from 'react'
import { isAiEnabled, subscribeAiEnabled } from '../lib/aiSettings'

/** Reactive view of the global AI on/off setting (see `src/lib/aiSettings.ts`). */
export function useAiEnabled(): boolean {
  return useSyncExternalStore(subscribeAiEnabled, isAiEnabled, () => true)
}
