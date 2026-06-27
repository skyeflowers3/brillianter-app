import type {
  LessonProgress,
  MasteryStatus,
  SkillCheckHistoryEntry,
} from '../types/progress'

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
 * Mastery tier for a lesson, or null if no skill check has been taken yet. Prefers the stored
 * `masteryStatus`, falling back to deriving it from history for older progress docs.
 */
export function getMasteryStatus(progress: LessonProgress | null | undefined): MasteryStatus | null {
  if (!progress) {
    return null
  }
  const stored = normalizeMasteryStatus(progress.masteryStatus)
  if (stored) {
    return stored
  }

  const best = getBestSkillCheck(progress)
  return best ? evaluateMastery(best.score, best.total) : null
}

function getAttemptCount(progress: LessonProgress): number {
  return progress.skillCheckAttempts ?? progress.skillCheckHistory?.length ?? 0
}

/**
 * Whether the learner owes a required retake: they scored Needs Review (<4/5) and have not yet
 * completed a second skill-check attempt. The next lesson stays locked while this is true.
 */
export function isRequiredRetakePending(progress: LessonProgress | null | undefined): boolean {
  if (!progress) {
    return false
  }
  if (getMasteryStatus(progress) !== 'needs_review') {
    return false
  }
  if (progress.requiredRetakeCompleted) {
    return false
  }
  return getAttemptCount(progress) < 2
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
