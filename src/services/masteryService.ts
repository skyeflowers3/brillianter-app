import type {
  LessonProgress,
  MasteryStatus,
  RetrievalSession,
  SkillCheckHistoryEntry,
} from '../types/progress'

/** Distinct successful spaced-retrieval days required to promote a Proficient lesson to Mastered. */
export const RETRIEVALS_FOR_MASTERY = 3

/**
 * Maps a skill-check score to a mastery tier. This is the single source of truth for the tiers, so
 * the dashboard badge, the skill-check results screen, and the celebration all agree.
 *
 * For a 5-question check: 5/5 -> Mastered, 4/5 -> Proficient, 0-3/5 -> Needs Review. The thresholds
 * generalize: a perfect score is Mastered, missing at most one is Proficient, anything else is
 * Needs Review.
 */
export function evaluateMastery(score: number, total: number): MasteryStatus {
  if (total <= 0) {
    return 'needs_review'
  }
  if (score >= total) {
    return 'mastered'
  }
  if (score >= total - 1) {
    return 'proficient'
  }
  return 'needs_review'
}

/**
 * Number of DISTINCT calendar days on which the lesson passed its retrieval slice. Counts unique
 * `date`s among passed sessions, so two passes on the same day (shouldn't happen — one quiz/day) can
 * never both count toward the spaced requirement. Tolerates a missing/empty history.
 */
export function countSuccessfulRetrievalDays(
  retrievalHistory: RetrievalSession[] | null | undefined,
): number {
  if (!retrievalHistory || retrievalHistory.length === 0) {
    return 0
  }
  const passedDays = new Set<string>()
  for (const session of retrievalHistory) {
    if (session.passedRetrievalSession) {
      passedDays.add(session.date)
    }
  }
  return passedDays.size
}

/**
 * The effective, displayed mastery tier, combining the (capped) skill-check tier with spaced
 * retrieval progress:
 * - `needs_review` whenever the skill-check tier is Needs Review (<4/5), regardless of retrievals.
 * - `mastered` once a passing skill check (Proficient+) is backed by at least
 *   `RETRIEVALS_FOR_MASTERY` successful spaced-retrieval days.
 * - `proficient` otherwise (a strong skill check that hasn't yet demonstrated long-term retention).
 *
 * A skill check on its own therefore tops out at `proficient`; only spaced retrieval earns Mastered.
 */
export function computeMasteryLevel(
  skillTier: MasteryStatus,
  successfulRetrievalSessions: number,
): MasteryStatus {
  if (skillTier === 'needs_review') {
    return 'needs_review'
  }
  return successfulRetrievalSessions >= RETRIEVALS_FOR_MASTERY ? 'mastered' : 'proficient'
}

/** The best skill-check attempt (by ratio) across all recorded attempts, or null if none. */
export function getBestSkillCheck(progress: LessonProgress): SkillCheckHistoryEntry | null {
  const history = progress.skillCheckHistory ?? []
  if (history.length === 0) {
    return null
  }

  return history.reduce((best, entry) =>
    entry.score / entry.total > best.score / best.total ? entry : best,
  )
}

/**
 * Coerce a stored mastery value to a tier the current build understands. Tolerates legacy/foreign
 * values (e.g. the old `developing` tier, since renamed to `proficient`) so a progress doc written
 * by a different build can never produce an unknown status that crashes a `MASTERY_PRESENTATION`
 * lookup. Unknown values return null and fall back to deriving the tier from history.
 */
export function normalizeMasteryStatus(value: unknown): MasteryStatus | null {
  if (value === 'mastered' || value === 'proficient' || value === 'needs_review') {
    return value
  }
  if (value === 'developing') {
    return 'proficient'
  }
  return null
}

/**
 * Effective mastery tier for a lesson, or null if no skill check has been taken yet.
 *
 * This is DERIVED LIVE from the underlying signals rather than read from a stored field, so the
 * result is independent of the order in which the learner completes things — three passed retrieval
 * sessions followed by a passing skill check yields the same Mastered as the reverse order, and the
 * promotion happens the moment both halves are satisfied. The two halves are:
 *   - the best skill-check score (the gate for ANY status, and for Needs Review vs Proficient), and
 *   - the number of distinct successful spaced-retrieval days (the gate for Mastered).
 *
 * Rules:
 *   1. No skill check recorded yet -> null (no badge), even if retrieval checks have been passed.
 *   2. Otherwise combine the capped skill tier with the successful-retrieval-day count. A skill check
 *      alone (even a perfect 5/5) tops out at Proficient; Mastered is earned ONLY by accumulating
 *      `RETRIEVALS_FOR_MASTERY` successful spaced-retrieval days. The stored `masteryStatus` field is
 *      intentionally ignored here so the tier is always derived live — a stale/legacy `mastered`
 *      value can never short-circuit the spaced-retrieval requirement.
 */
export function getMasteryStatus(progress: LessonProgress | null | undefined): MasteryStatus | null {
  if (!progress) {
    return null
  }

  // (1) A skill check is required before any status appears — retrieval checks alone don't count.
  const best = getBestSkillCheck(progress)
  if (!best) {
    return null
  }

  // (2) Combine the (capped) skill-check tier with spaced-retrieval progress, in any order.
  const skillTier = evaluateMastery(best.score, best.total)
  const cappedSkillTier = skillTier === 'mastered' ? 'proficient' : skillTier
  return computeMasteryLevel(cappedSkillTier, countSuccessfulRetrievalDays(progress.retrievalHistory))
}

/**
 * Whether the learner still owes the required remediation: they scored Needs Review (<4/5) and have
 * not yet completed the personalized review AND retaken the skill check. The next lesson stays
 * locked while this is true. (`requiredRetakeCompleted` is set once a skill check is recorded after
 * the personalized review is done — see `recordSkillCheckResult`.)
 */
export function isRequiredRetakePending(progress: LessonProgress | null | undefined): boolean {
  if (!progress) {
    return false
  }
  if (getMasteryStatus(progress) !== 'needs_review') {
    return false
  }
  return !progress.requiredRetakeCompleted
}

export interface MasteryPresentation {
  label: string
  badge: string
  /** Short, supportive line shown on the skill-check results screen. */
  message: string
}

export const MASTERY_PRESENTATION: Record<MasteryStatus, MasteryPresentation> = {
  mastered: {
    label: 'Mastered',
    badge: '🏆',
    message: "Perfect score! You've mastered this.",
  },
  proficient: {
    label: 'Proficient',
    badge: '🎯',
    message: 'Strong work — you know this well. Come back anytime to earn full mastery.',
  },
  needs_review: {
    label: 'Needs Review',
    badge: '📘',
    message: "You're getting there. A quick review and you'll have it.",
  },
}
