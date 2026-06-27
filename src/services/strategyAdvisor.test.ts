import { describe, expect, it } from 'vitest'
import { suggestStrategy } from './strategyAdvisor'
import type { Question, QuestionType } from '../types/lesson'
import type { ConceptMasteryLevel, ConceptStat, MasteryProfile } from '../types/masteryProfile'
import type { ConceptTag } from '../types/concepts'

function question(type: QuestionType, conceptTags: ConceptTag[]): Question {
  return { id: 'q', type, conceptTags } as unknown as Question
}

function stat(
  concept: ConceptTag,
  level: ConceptMasteryLevel,
  attempts: number,
): ConceptStat {
  return {
    concept,
    attempts,
    correct: level === 'weak' ? 0 : attempts,
    accuracy: level === 'weak' ? 0 : 1,
    level,
    needsFollowUp: false,
    lastSeenAt: new Date().toISOString(),
  }
}

function profile(stats: ConceptStat[]): MasteryProfile {
  const concepts: Record<string, ConceptStat> = {}
  for (const item of stats) {
    concepts[item.concept] = item
  }
  return { userId: 'u', concepts, updatedAt: new Date().toISOString() }
}

const STRONG_GUIDED_WEAK_UNGUIDED = profile([
  stat('guided', 'strong', 4),
  stat('unguided', 'weak', 3),
])

describe('suggestStrategy', () => {
  it('suggests plotting on an unguided plottable question when guided is strong but unguided is weak', () => {
    const result = suggestStrategy(
      question('vectorSubtract', ['vector-subtraction', 'unguided']),
      STRONG_GUIDED_WEAK_UNGUIDED,
    )
    expect(result?.id).toBe('plot-it')
  })

  it('returns null without a profile', () => {
    expect(suggestStrategy(question('vectorSubtract', ['unguided']), null)).toBeNull()
  })

  it('does not suggest on a guided question even when the pattern holds', () => {
    const result = suggestStrategy(
      question('vectorSubtract', ['vector-subtraction', 'guided']),
      STRONG_GUIDED_WEAK_UNGUIDED,
    )
    expect(result).toBeNull()
  })

  it('does not suggest on a non-plottable type (multiple choice)', () => {
    const result = suggestStrategy(
      question('multipleChoice', ['scalar-multiplication', 'unguided']),
      STRONG_GUIDED_WEAK_UNGUIDED,
    )
    expect(result).toBeNull()
  })

  it('does not suggest when the learner is not yet strong on guided', () => {
    const result = suggestStrategy(
      question('vectorSubtract', ['unguided']),
      profile([stat('guided', 'developing', 4), stat('unguided', 'weak', 3)]),
    )
    expect(result).toBeNull()
  })

  it('does not suggest when there is not enough unguided evidence yet', () => {
    const result = suggestStrategy(
      question('vectorSubtract', ['unguided']),
      profile([stat('guided', 'strong', 4), stat('unguided', 'weak', 1)]),
    )
    expect(result).toBeNull()
  })

  it('does not suggest when unguided is not weak', () => {
    const result = suggestStrategy(
      question('vectorSubtract', ['unguided']),
      profile([stat('guided', 'strong', 4), stat('unguided', 'developing', 3)]),
    )
    expect(result).toBeNull()
  })
})
