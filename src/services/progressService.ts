import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebaseDb'
import {
  createDefaultProgress,
  getProgressDocId,
  type LessonProgress,
  type SkillCheckHistoryEntry,
  type SkillCheckResult,
} from '../types/progress'
import {
  computeMasteryLevel,
  countSuccessfulRetrievalDays,
  evaluateMastery,
} from './masteryService'

export async function getLessonProgress(
  userId: string,
  lessonId: string,
): Promise<LessonProgress | null> {
  const snapshot = await getDoc(doc(db, 'progress', getProgressDocId(userId, lessonId)))

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as LessonProgress
}

export async function getAllLessonProgress(userId: string): Promise<LessonProgress[]> {
  const progressQuery = query(collection(db, 'progress'), where('userId', '==', userId))
  const snapshot = await getDocs(progressQuery)

  return snapshot.docs.map((entry) => entry.data() as LessonProgress)
}

/** Permanently deletes every lesson-progress document for the user (lessons + skill checks). */
export async function deleteAllLessonProgress(userId: string): Promise<void> {
  const progressQuery = query(collection(db, 'progress'), where('userId', '==', userId))
  const snapshot = await getDocs(progressQuery)

  await Promise.all(snapshot.docs.map((entry) => deleteDoc(entry.ref)))
}

export async function ensureLessonProgress(
  userId: string,
  lessonId: string,
): Promise<LessonProgress> {
  const existing = await getLessonProgress(userId, lessonId)

  if (existing) {
    return existing
  }

  const progress = createDefaultProgress(userId, lessonId)
  await setDoc(doc(db, 'progress', getProgressDocId(userId, lessonId)), progress)
  return progress
}

export async function saveLessonProgress(progress: LessonProgress): Promise<void> {
  await setDoc(doc(db, 'progress', getProgressDocId(progress.userId, progress.lessonId)), progress)
}

/**
 * Resets the lesson's question progress so it can be redone, while preserving the skill-check
 * record and mastery — retrying the lesson questions must not erase a skill check the learner
 * already passed (or demote their mastery).
 */
export async function resetLessonProgress(userId: string, lessonId: string): Promise<LessonProgress> {
  const existing = await getLessonProgress(userId, lessonId)

  const progress: LessonProgress = existing
    ? {
        ...existing,
        completed: false,
        currentQuestionIndex: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        questionHistory: [],
        awaitingContinue: false,
      }
    : createDefaultProgress(userId, lessonId)

  await saveLessonProgress(progress)
  return progress
}

/**
 * Marks the personalized review (remediation practice) as completed. On its own this does NOT
 * unlock the next lesson — the learner must still retake the skill check afterward, at which point
 * `recordSkillCheckResult` sets `requiredRetakeCompleted`. Called when a practice session finishes.
 */
export async function markRemediationCompleted(
  userId: string,
  lessonId: string,
): Promise<LessonProgress> {
  const existing = await ensureLessonProgress(userId, lessonId)
  if (existing.remediationCompleted) {
    return existing
  }
  const updated: LessonProgress = { ...existing, remediationCompleted: true }
  await saveLessonProgress(updated)
  return updated
}

export async function recordSkillCheckResult(
  userId: string,
  lessonId: string,
  result: SkillCheckResult,
): Promise<LessonProgress> {
  const existing = await ensureLessonProgress(userId, lessonId)

  const historyEntry: SkillCheckHistoryEntry = {
    completedAt: new Date().toISOString(),
    score: result.score,
    total: result.total,
    answers: result.answers,
  }

  const history = [...(existing.skillCheckHistory ?? []), historyEntry]
  const attempts = (existing.skillCheckAttempts ?? existing.skillCheckHistory?.length ?? 0) + 1

  // Mastery is based on the best attempt ever, so a weaker retake never demotes the learner.
  const best = history.reduce((top, entry) =>
    entry.score / entry.total > top.score / top.total ? entry : top,
  )
  // A skill check alone now tops out at Proficient: a perfect score is strong understanding, but
  // Mastered must be earned through spaced retrieval over time. We cap the skill-check tier here and
  // fold in any spaced-retrieval days already accumulated for this lesson to get the effective level.
  const skillTier = evaluateMastery(best.score, best.total)
  const cappedSkillTier = skillTier === 'mastered' ? 'proficient' : skillTier
  const masteryStatus = cappedSkillTier
  const masteryLevel = computeMasteryLevel(
    cappedSkillTier,
    countSuccessfulRetrievalDays(existing.retrievalHistory),
  )

  // The required remediation is satisfied once the learner retakes the skill check AFTER completing
  // the personalized review (i.e. `remediationCompleted` was already true when this attempt was
  // recorded). This is the "do the review, then retake" path that unlocks the next lesson for a
  // struggling learner regardless of the retake score, so they can never get permanently stuck.
  const requiredRetakeCompleted =
    existing.requiredRetakeCompleted === true || existing.remediationCompleted === true

  const updated: LessonProgress = {
    ...existing,
    skillCheckCompleted: true,
    skillCheckScore: result.score,
    latestSkillCheckScore: result.score,
    highestSkillCheckScore: best.score,
    skillCheckHistory: history,
    skillCheckAttempts: attempts,
    masteryStatus,
    masteryLevel,
    requiredRetakeCompleted,
  }

  await saveLessonProgress(updated)
  return updated
}
