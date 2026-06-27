import type { Question, QuestionType } from '../types/lesson'
import type { ConceptStat, MasteryProfile } from '../types/masteryProfile'
import type { ConceptTag } from '../types/concepts'

/**
 * A contextual, non-intrusive learning-strategy nudge. Unlike a hint (which is about the current
 * question's answer) a strategy suggestion is about *how* to approach the work, inferred from the
 * learner's pattern across many questions. It is shown only when the pattern actually warrants it.
 */
export interface StrategySuggestion {
  id: string
  message: string
}

/**
 * Question types where physically sketching the vectors on the grid recreates the reasoning steps,
 * so "try plotting it" is genuinely useful. Excludes types where the vector is already drawn for the
 * learner (read-vector, magnitude) or there's nothing to plot (multiple choice).
 */
const GRID_PLOTTABLE_TYPES = new Set<QuestionType>([
  'drawVector',
  'headToTailAdd',
  'headToTailConnect',
  'headToTailDrawSum',
  'headToTailFull',
  'headToTailFree',
  'scalarSlider',
  'negateVector',
  'vectorSubtract',
  'linearCombo',
  'constructCombo',
])

/** Require a little evidence before calling the unguided weakness a real pattern, not one bad day. */
const MIN_UNGUIDED_ATTEMPTS = 2

function conceptStat(profile: MasteryProfile, concept: ConceptTag): ConceptStat | undefined {
  return profile.concepts[concept]
}

function isUnguided(question: Question): boolean {
  return question.conceptTags?.includes('unguided') ?? false
}

/**
 * Pattern: the learner is reliably strong when the steps are scaffolded (guided) but weak when
 * they have to work it out themselves (unguided). On an unguided, plottable question this is exactly
 * when "sketch it on the grid" helps — it recreates the missing scaffold. This is the only case we
 * surface the plotting nudge, so it never nags learners who are already comfortable on their own.
 */
function plotItStrategy(
  question: Question,
  profile: MasteryProfile,
): StrategySuggestion | null {
  if (!isUnguided(question) || !GRID_PLOTTABLE_TYPES.has(question.type)) {
    return null
  }

  const guided = conceptStat(profile, 'guided')
  const unguided = conceptStat(profile, 'unguided')
  if (!guided || !unguided) {
    return null
  }

  const strongWhenGuided = guided.level === 'strong'
  const weakWhenUnguided =
    unguided.level === 'weak' && unguided.attempts >= MIN_UNGUIDED_ATTEMPTS
  if (!strongWhenGuided || !weakWhenUnguided) {
    return null
  }

  return {
    id: 'plot-it',
    message:
      'You tend to nail these when the steps are laid out. Try plotting it on the grid first — sketching the vectors recreates those steps and often makes the answer click.',
  }
}

const DETECTORS: ((question: Question, profile: MasteryProfile) => StrategySuggestion | null)[] = [
  plotItStrategy,
]

/**
 * The single strategy suggestion (if any) worth showing for this question given the learner's
 * mastery profile. Returns null when there's no useful, well-supported suggestion — the common case.
 */
export function suggestStrategy(
  question: Question | undefined | null,
  profile: MasteryProfile | undefined | null,
): StrategySuggestion | null {
  if (!question || !profile) {
    return null
  }
  for (const detect of DETECTORS) {
    const suggestion = detect(question, profile)
    if (suggestion) {
      return suggestion
    }
  }
  return null
}
