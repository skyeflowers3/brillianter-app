import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Firestore primitives and the app's db handle. doc() returns a sentinel so we can
// assert updateDoc was called with the right shape without touching real Firestore.
const updateDoc = vi.fn()
const doc = vi.fn(() => ({ __ref: true }))

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => doc(...args),
  updateDoc: (...args: unknown[]) => updateDoc(...args),
}))

vi.mock('../firebaseDb', () => ({ db: {} }))

const getUserProfile = vi.fn()
vi.mock('./userService', () => ({
  getUserProfile: (...args: unknown[]) => getUserProfile(...args),
}))

import { updateStreak } from './streakService'

describe('updateStreak', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateDoc.mockResolvedValue(undefined)
  })

  it('writes streak=1 on the first activity (no prior profile)', async () => {
    getUserProfile.mockResolvedValue(null)

    const result = await updateStreak('user1', new Date(2026, 5, 24))

    expect(result).toEqual({ currentStreak: 1, lastActiveDate: '2026-06-24', changed: true })
    expect(updateDoc).toHaveBeenCalledTimes(1)
    expect(updateDoc).toHaveBeenCalledWith(
      { __ref: true },
      { currentStreak: 1, lastActiveDate: '2026-06-24' },
    )
  })

  it('does NOT write on same-day activity', async () => {
    getUserProfile.mockResolvedValue({ currentStreak: 3, lastActiveDate: '2026-06-24' })

    const result = await updateStreak('user1', new Date(2026, 5, 24, 18))

    expect(result.changed).toBe(false)
    expect(result.currentStreak).toBe(3)
    expect(updateDoc).not.toHaveBeenCalled()
  })

  it('increments and writes on a consecutive day', async () => {
    getUserProfile.mockResolvedValue({ currentStreak: 4, lastActiveDate: '2026-06-23' })

    const result = await updateStreak('user1', new Date(2026, 5, 24))

    expect(result).toEqual({ currentStreak: 5, lastActiveDate: '2026-06-24', changed: true })
    expect(updateDoc).toHaveBeenCalledTimes(1)
    expect(updateDoc).toHaveBeenCalledWith(
      { __ref: true },
      { currentStreak: 5, lastActiveDate: '2026-06-24' },
    )
  })

  it('resets to 1 and writes after a broken streak', async () => {
    getUserProfile.mockResolvedValue({ currentStreak: 9, lastActiveDate: '2026-06-20' })

    const result = await updateStreak('user1', new Date(2026, 5, 24))

    expect(result).toEqual({ currentStreak: 1, lastActiveDate: '2026-06-24', changed: true })
    expect(updateDoc).toHaveBeenCalledTimes(1)
  })

  it('swallows Firestore write errors so callers are not blocked', async () => {
    getUserProfile.mockResolvedValue(null)
    updateDoc.mockRejectedValue(new Error('missing doc'))
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await updateStreak('user1', new Date(2026, 5, 24))

    expect(result.changed).toBe(true)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
