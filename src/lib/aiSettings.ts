/**
 * Global on/off switch for every AI feature (personalized mistake feedback, the AI tutor chat, and
 * AI question proposals for practice/retrieval). Persisted in localStorage so the choice survives
 * reloads, and exposed as a tiny observable store so both React UI (via `useAiEnabled`) and the
 * non-React services stay in sync.
 *
 * When off, each AI entry point falls back to its existing offline behavior: static/heuristic
 * feedback, a hidden tutor widget, and locally-varied (non-AI) practice questions. Correctness of
 * questions never depended on AI, so turning it off only removes the LLM-flavored extras.
 */

const STORAGE_KEY = 'aiEnabled'

type Listener = () => void
const listeners = new Set<Listener>()

/** AI is on by default; only an explicit '0' disables it. Storage errors fail open (AI on). */
export function isAiEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== '0'
  } catch {
    return true
  }
}

export function setAiEnabled(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
  } catch {
    // Storage unavailable (e.g. private mode): the toggle just won't persist; notify listeners anyway.
  }
  listeners.forEach((listener) => listener())
}

/** Subscribe to changes; returns an unsubscribe fn. Used by `useAiEnabled`'s external store. */
export function subscribeAiEnabled(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
