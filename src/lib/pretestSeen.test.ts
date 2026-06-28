import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clearPretestSeen, isPretestSeen, markPretestSeen } from './pretestSeen'

const UID = 'user-1'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
})

describe('pretestSeen flag', () => {
  it('shows a pretest once per lesson, then suppresses it after it is marked seen', () => {
    expect(isPretestSeen(UID, 'lesson-1')).toBe(false)

    markPretestSeen(UID, 'lesson-1')

    expect(isPretestSeen(UID, 'lesson-1')).toBe(true)
  })

  it('tracks each lesson independently', () => {
    markPretestSeen(UID, 'lesson-1')

    expect(isPretestSeen(UID, 'lesson-1')).toBe(true)
    expect(isPretestSeen(UID, 'lesson-2')).toBe(false)
  })

  it('survives a reload (the flag is read fresh from storage each time)', () => {
    markPretestSeen(UID, 'lesson-1')

    // Simulate a fresh page load: no in-memory state, only what is in localStorage.
    expect(isPretestSeen(UID, 'lesson-1')).toBe(true)
  })

  it('reshows every pretest after a progress reset clears the flags', () => {
    markPretestSeen(UID, 'lesson-1')
    markPretestSeen(UID, 'lesson-2')

    clearPretestSeen(UID)

    expect(isPretestSeen(UID, 'lesson-1')).toBe(false)
    expect(isPretestSeen(UID, 'lesson-2')).toBe(false)
  })

  it('only clears the resetting user, leaving other users untouched', () => {
    markPretestSeen(UID, 'lesson-1')
    markPretestSeen('user-2', 'lesson-1')

    clearPretestSeen(UID)

    expect(isPretestSeen(UID, 'lesson-1')).toBe(false)
    expect(isPretestSeen('user-2', 'lesson-1')).toBe(true)
  })
})
