import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isAiEnabled, setAiEnabled, subscribeAiEnabled } from './aiSettings'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
})

describe('aiSettings', () => {
  it('defaults to enabled when nothing is stored', () => {
    expect(isAiEnabled()).toBe(true)
  })

  it('persists the off state and reads it back', () => {
    setAiEnabled(false)
    expect(isAiEnabled()).toBe(false)
    expect(window.localStorage.getItem('aiEnabled')).toBe('0')

    setAiEnabled(true)
    expect(isAiEnabled()).toBe(true)
  })

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeAiEnabled(listener)

    setAiEnabled(false)
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    setAiEnabled(true)
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
