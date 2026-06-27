import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { Question } from '../types/lesson'
import { CONCEPT_LABELS, type ConceptTag } from '../types/concepts'
import {
  createEmptyMasteryProfile,
  type ConceptMasteryLevel,
  type ConceptOutcome,
  type ConceptStat,
  type MasteryProfile,
} from '../types/masteryProfile'

const MASTERY_PROFILE_COLLECTION = 'masteryProfiles'

/** Accuracy at or above this (with enough attempts) counts as a strong concept. */
const STRONG_ACCURACY = 0.8
/** Accuracy at or above this counts as developing; below it is weak. */
const DEVELOPING_ACCURACY = 0.5
/** Minimum attempts before a high accuracy is trusted as "strong" rather than "developing". */
const STRONG_MIN_ATTEMPTS = 2

/**
 * Map a rolling accuracy + attempt count to a mastery level. A single miss drops a concept to
 * `weak` so a failed skill check immediately flags the right concepts; reaching `strong` requires
 * sustained accuracy over more than one attempt.
 */
export function evaluateConceptLevel(accuracy: number, attempts: number): ConceptMasteryLevel {
  if (attempts <= 0) {
    return 'developing'
  }
  if (accuracy >= STRONG_ACCURACY && attempts >= STRONG_MIN_ATTEMPTS) {
    return 'strong'
  }
  if (accuracy >= DEVELOPING_ACCURACY) {
    return 'developing'
  }
  return 'weak'
}

/**
 * Fold a batch of graded concept outcomes into a profile, returning a new profile (pure). Each
 * outcome bumps that concept's attempts/correct counts and recomputes its level. Recovering to
 * `strong` clears any pending follow-up flag.
 */
export function recordConceptOutcomes(
  profile: MasteryProfile,
  outcomes: ConceptOutcome[],
  now: string = new Date().toISOString(),
): MasteryProfile {
  if (outcomes.length === 0) {
    return profile
  }

  const concepts: Record<string, ConceptStat> = { ...profile.concepts }

  for (const { concept, correct } of outcomes) {
    const existing = concepts[concept]
    const attempts = (existing?.attempts ?? 0) + 1
    const correctCount = (existing?.correct ?? 0) + (correct ? 1 : 0)
    const accuracy = correctCount / attempts
    const level = evaluateConceptLevel(accuracy, attempts)

    concepts[concept] = {
      concept,
      attempts,
      correct: correctCount,
      accuracy,
      level,
      needsFollowUp: level === 'strong' ? false : (existing?.needsFollowUp ?? false),
      lastSeenAt: now,
    }
  }

  return { ...profile, concepts, updatedAt: now }
}

/** Expand graded answers into per-concept outcomes using each question's concept tags. */
export function deriveOutcomesFromAnswers(
  questions: Question[],
  answers: { questionId: string; correct: boolean }[],
): ConceptOutcome[] {
  const tagsById = new Map<string, ConceptTag[]>()
  for (const question of questions) {
    tagsById.set(question.id, question.conceptTags ?? [])
  }

  const outcomes: ConceptOutcome[] = []
  for (const { questionId, correct } of answers) {
    for (const concept of tagsById.get(questionId) ?? []) {
      outcomes.push({ concept, correct })
    }
  }
  return outcomes
}

/** Mark concepts for next-login follow-up (e.g. still weak after a remediation flow). */
export function flagConceptsForFollowUp(
  profile: MasteryProfile,
  concepts: ConceptTag[],
  now: string = new Date().toISOString(),
): MasteryProfile {
  if (concepts.length === 0) {
    return profile
  }
  const next: Record<string, ConceptStat> = { ...profile.concepts }
  for (const concept of concepts) {
    const existing = next[concept]
    next[concept] = existing
      ? { ...existing, needsFollowUp: true }
      : {
          concept,
          attempts: 0,
          correct: 0,
          accuracy: 0,
          level: 'weak',
          needsFollowUp: true,
          lastSeenAt: now,
        }
  }
  return { ...profile, concepts: next, updatedAt: now }
}

/** Concepts the learner is currently weak on, weakest (lowest accuracy) first. */
export function getWeakConcepts(profile: MasteryProfile): ConceptStat[] {
  return Object.values(profile.concepts)
    .filter((stat) => stat.level === 'weak')
    .sort((a, b) => a.accuracy - b.accuracy)
}

/** Concepts flagged for next-login follow-up. */
export function getFollowUpConcepts(profile: MasteryProfile): ConceptStat[] {
  return Object.values(profile.concepts).filter((stat) => stat.needsFollowUp)
}

/**
 * One-line, human-readable summary of where the learner is struggling, for the AI tutor's context.
 * Empty when there's nothing notable yet, so the tutor stays general rather than inventing a weakness.
 */
export function summarizeMasteryForTutor(profile: MasteryProfile): string {
  const weak = getWeakConcepts(profile).slice(0, 4)
  if (weak.length === 0) {
    return ''
  }
  const labels = weak.map((stat) => CONCEPT_LABELS[stat.concept])
  return `Concepts the student is currently struggling with: ${labels.join(', ')}.`
}

export async function getMasteryProfile(userId: string): Promise<MasteryProfile> {
  const snapshot = await getDoc(doc(db, MASTERY_PROFILE_COLLECTION, userId))
  if (!snapshot.exists()) {
    return createEmptyMasteryProfile(userId)
  }
  return snapshot.data() as MasteryProfile
}

export async function saveMasteryProfile(profile: MasteryProfile): Promise<void> {
  await setDoc(doc(db, MASTERY_PROFILE_COLLECTION, profile.userId), profile)
}

/**
 * Convenience: read the profile, fold in a batch of outcomes, and persist. Returns the updated
 * profile. Used by the answer/skill-check flows in later phases.
 */
export async function applyConceptOutcomes(
  userId: string,
  outcomes: ConceptOutcome[],
): Promise<MasteryProfile> {
  const profile = await getMasteryProfile(userId)
  const updated = recordConceptOutcomes(profile, outcomes)
  if (updated !== profile) {
    await saveMasteryProfile(updated)
  }
  return updated
}

/** Read the profile, flag the given concepts for next-login follow-up, and persist. */
export async function flagConceptsNeedFollowUp(
  userId: string,
  concepts: ConceptTag[],
): Promise<MasteryProfile> {
  const profile = await getMasteryProfile(userId)
  const updated = flagConceptsForFollowUp(profile, concepts)
  if (updated !== profile) {
    await saveMasteryProfile(updated)
  }
  return updated
}
