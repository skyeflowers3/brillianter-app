import { describe, expect, it } from 'vitest'
import {
  deriveOutcomesFromAnswers,
  evaluateConceptLevel,
  flagConceptsForFollowUp,
  getFollowUpConcepts,
  getWeakConcepts,
  recordConceptOutcomes,
  summarizeMasteryForTutor,
} from './masteryProfileService'
import { createEmptyMasteryProfile } from '../types/masteryProfile'
import type { Question } from '../types/lesson'

const NOW = '2026-06-25T00:00:00.000Z'

describe('evaluateConceptLevel', () => {
  it('treats no attempts as developing (unknown)', () => {
    expect(evaluateConceptLevel(0, 0)).toBe('developing')
  })

  it('requires sustained accuracy for strong', () => {
    // One correct attempt: high accuracy but not enough evidence -> developing.
    expect(evaluateConceptLevel(1, 1)).toBe('developing')
    expect(evaluateConceptLevel(1, 2)).toBe('strong')
    expect(evaluateConceptLevel(0.8, 5)).toBe('strong')
  })

  it('flags a single miss as weak', () => {
    expect(evaluateConceptLevel(0, 1)).toBe('weak')
    expect(evaluateConceptLevel(0.4, 5)).toBe('weak')
  })

  it('treats middling accuracy as developing', () => {
    expect(evaluateConceptLevel(0.5, 4)).toBe('developing')
  })
})

describe('recordConceptOutcomes', () => {
  it('accumulates attempts and recomputes accuracy and level', () => {
    let profile = createEmptyMasteryProfile('u1')
    profile = recordConceptOutcomes(
      profile,
      [
        { concept: 'vector-addition', correct: true },
        { concept: 'vector-addition', correct: false },
      ],
      NOW,
    )

    const stat = profile.concepts['vector-addition']
    expect(stat.attempts).toBe(2)
    expect(stat.correct).toBe(1)
    expect(stat.accuracy).toBe(0.5)
    expect(stat.level).toBe('developing')
    expect(profile.updatedAt).toBe(NOW)
  })

  it('clears needsFollowUp once a concept recovers to strong', () => {
    let profile = createEmptyMasteryProfile('u1')
    profile = flagConceptsForFollowUp(profile, ['coordinate-order'], NOW)
    expect(profile.concepts['coordinate-order'].needsFollowUp).toBe(true)

    profile = recordConceptOutcomes(
      profile,
      [
        { concept: 'coordinate-order', correct: true },
        { concept: 'coordinate-order', correct: true },
      ],
      NOW,
    )

    expect(profile.concepts['coordinate-order'].level).toBe('strong')
    expect(profile.concepts['coordinate-order'].needsFollowUp).toBe(false)
  })

  it('returns the same profile reference when there are no outcomes', () => {
    const profile = createEmptyMasteryProfile('u1')
    expect(recordConceptOutcomes(profile, [], NOW)).toBe(profile)
  })
})

describe('deriveOutcomesFromAnswers', () => {
  it('expands each answer into one outcome per concept tag', () => {
    const questions = [
      { id: 'q1', conceptTags: ['vector-addition', 'coordinate-order', 'unguided'] },
      { id: 'q2', conceptTags: ['magnitude'] },
    ] as unknown as Question[]

    const outcomes = deriveOutcomesFromAnswers(questions, [
      { questionId: 'q1', correct: false },
      { questionId: 'q2', correct: true },
    ])

    expect(outcomes).toEqual([
      { concept: 'vector-addition', correct: false },
      { concept: 'coordinate-order', correct: false },
      { concept: 'unguided', correct: false },
      { concept: 'magnitude', correct: true },
    ])
  })

  it('ignores answers for unknown or untagged questions', () => {
    const questions = [{ id: 'q1', conceptTags: [] }] as unknown as Question[]
    const outcomes = deriveOutcomesFromAnswers(questions, [
      { questionId: 'q1', correct: true },
      { questionId: 'missing', correct: false },
    ])
    expect(outcomes).toHaveLength(0)
  })
})

describe('weak and follow-up concept selectors', () => {
  it('returns weak concepts weakest-first and follow-up concepts', () => {
    let profile = createEmptyMasteryProfile('u1')
    profile = recordConceptOutcomes(
      profile,
      [
        // 0/2 -> weak (accuracy 0)
        { concept: 'vector-subtraction', correct: false },
        { concept: 'vector-subtraction', correct: false },
        // 1/3 -> weak (accuracy ~0.33)
        { concept: 'negative-vectors', correct: false },
        { concept: 'negative-vectors', correct: false },
        { concept: 'negative-vectors', correct: true },
        // 2/2 -> strong
        { concept: 'magnitude', correct: true },
        { concept: 'magnitude', correct: true },
      ],
      NOW,
    )

    const weak = getWeakConcepts(profile)
    expect(weak.map((stat) => stat.concept)).toEqual(['vector-subtraction', 'negative-vectors'])
    expect(weak[0].accuracy).toBeLessThanOrEqual(weak[1].accuracy)

    profile = flagConceptsForFollowUp(profile, ['vector-subtraction'], NOW)
    expect(getFollowUpConcepts(profile).map((stat) => stat.concept)).toEqual(['vector-subtraction'])
  })
})

describe('summarizeMasteryForTutor', () => {
  it('is empty when there are no weak concepts', () => {
    expect(summarizeMasteryForTutor(createEmptyMasteryProfile('u1'))).toBe('')
  })

  it('names the weak concepts with their human labels', () => {
    let profile = createEmptyMasteryProfile('u1')
    profile = recordConceptOutcomes(
      profile,
      [
        { concept: 'negative-vectors', correct: false },
        { concept: 'negative-vectors', correct: false },
      ],
      NOW,
    )
    const summary = summarizeMasteryForTutor(profile)
    expect(summary).toContain('Negative vectors')
  })
})
