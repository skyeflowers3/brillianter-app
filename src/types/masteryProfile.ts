import type { ConceptTag } from './concepts'

/**
 * Concept-level mastery: how well the learner understands a single concept, derived from a rolling
 * accuracy over their attempts on questions tagged with that concept.
 *
 *   - `strong`     — high accuracy; the learner reliably gets this concept right.
 *   - `developing` — mixed; sometimes right, sometimes not.
 *   - `weak`       — low accuracy; this concept is a likely source of mistakes.
 */
export type ConceptMasteryLevel = 'strong' | 'developing' | 'weak'

export interface ConceptStat {
  concept: ConceptTag
  /** Total graded attempts seen for this concept. */
  attempts: number
  /** Of those attempts, how many were correct. */
  correct: number
  /** Rolling accuracy in [0, 1]. */
  accuracy: number
  level: ConceptMasteryLevel
  /**
   * Set when the learner is still weak on this concept after a remediation flow. Surfaced on their
   * next login (Phase 8) to steer them back to targeted practice. Cleared once they recover.
   */
  needsFollowUp: boolean
  /** ISO timestamp of the most recent attempt that touched this concept. */
  lastSeenAt: string
}

/**
 * Per-user, concept-keyed view of understanding. Unlike lesson progress (which tracks scores per
 * lesson), this tracks *concepts* across lessons, so the AI can reason about *why* a learner
 * struggles, not just *that* they did. Updated by every graded interaction (Phase 3+).
 */
export interface MasteryProfile {
  userId: string
  concepts: Record<string, ConceptStat>
  /** ISO timestamp of the last update. */
  updatedAt: string
}

/** A single graded observation: did the learner get a concept right on one attempt. */
export interface ConceptOutcome {
  concept: ConceptTag
  correct: boolean
}

export function createEmptyMasteryProfile(userId: string): MasteryProfile {
  return {
    userId,
    concepts: {},
    updatedAt: new Date(0).toISOString(),
  }
}
