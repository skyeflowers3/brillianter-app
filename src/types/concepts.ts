/**
 * Concept taxonomy for the learning platform.
 *
 * Every authored lesson and skill-check question is tagged with one or more `ConceptTag`s (see
 * `src/content/conceptTags.ts`). Tags are multi-dimensional on purpose:
 *
 *   1. Topic / skill        — what math the question exercises (e.g. `vector-addition`).
 *   2. Misconception axis    — structural error a learner can make on it (e.g. `coordinate-order`).
 *   3. Interaction mode      — `guided` (steps are checked) vs `unguided` (only the answer is graded).
 *
 * These tags drive three downstream AI features: per-mistake feedback (Phase 3), the personalized
 * practice engine (Phase 4), and the concept-level mastery profile (this phase). Keeping them in a
 * single controlled vocabulary means feedback, practice, and the profile all speak the same language.
 */

export type TopicConcept =
  | 'plot-vector'
  | 'read-vector'
  | 'magnitude'
  | 'direction'
  | 'vector-addition'
  | 'head-to-tail'
  | 'scalar-multiplication'
  | 'find-scalar'
  | 'vector-subtraction'
  | 'negative-vectors'
  | 'linear-combination'
  | 'decompose-combination'

/** Structural mistakes a learner can make, independent of the specific topic. */
export type MisconceptionConcept = 'coordinate-order' | 'negative-components'

/** How much the question scaffolds the learner. Used for cross-category strategy suggestions. */
export type InteractionModeConcept = 'guided' | 'unguided'

export type ConceptTag = TopicConcept | MisconceptionConcept | InteractionModeConcept

/** Human-readable labels for surfacing concepts in tutoring, feedback, and the dashboard. */
export const CONCEPT_LABELS: Record<ConceptTag, string> = {
  'plot-vector': 'Plotting vectors',
  'read-vector': 'Reading vector components',
  magnitude: 'Magnitude',
  direction: 'Direction',
  'vector-addition': 'Vector addition',
  'head-to-tail': 'Head-to-tail method',
  'scalar-multiplication': 'Scalar multiplication',
  'find-scalar': 'Finding the scalar',
  'vector-subtraction': 'Vector subtraction',
  'negative-vectors': 'Negative vectors',
  'linear-combination': 'Linear combinations',
  'decompose-combination': 'Decomposing combinations',
  'coordinate-order': 'Coordinate order (x vs y)',
  'negative-components': 'Negative components',
  guided: 'Guided practice',
  unguided: 'Independent practice',
}

export const TOPIC_CONCEPTS: readonly TopicConcept[] = [
  'plot-vector',
  'read-vector',
  'magnitude',
  'direction',
  'vector-addition',
  'head-to-tail',
  'scalar-multiplication',
  'find-scalar',
  'vector-subtraction',
  'negative-vectors',
  'linear-combination',
  'decompose-combination',
]

export const MISCONCEPTION_CONCEPTS: readonly MisconceptionConcept[] = [
  'coordinate-order',
  'negative-components',
]

export const INTERACTION_MODE_CONCEPTS: readonly InteractionModeConcept[] = ['guided', 'unguided']

export const ALL_CONCEPT_TAGS: readonly ConceptTag[] = [
  ...TOPIC_CONCEPTS,
  ...MISCONCEPTION_CONCEPTS,
  ...INTERACTION_MODE_CONCEPTS,
]

const CONCEPT_TAG_SET = new Set<string>(ALL_CONCEPT_TAGS)

export function isConceptTag(value: string): value is ConceptTag {
  return CONCEPT_TAG_SET.has(value)
}

export function conceptLabel(tag: ConceptTag): string {
  return CONCEPT_LABELS[tag]
}

export function isTopicConcept(tag: ConceptTag): tag is TopicConcept {
  return (TOPIC_CONCEPTS as readonly string[]).includes(tag)
}
