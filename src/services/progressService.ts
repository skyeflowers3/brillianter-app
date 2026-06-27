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
import { db } from '../firebase'
import {
  createDefaultProgress,
  getProgressDocId,
  type LessonProgress,
  type SkillCheckHistoryEntry,
  type SkillCheckResult,
} from '../types/progress'
import { evaluateMastery } from './masteryService'

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
 * Marks the required post-Needs-Review remediation as done so the next lesson unlocks regardless of
 * score (the learner can never get permanently stuck). Called when a personalized practice session
 * is completed.
 */
export async function completeRequiredRetake(
  userId: string,
  lessonId: string,
): Promise<LessonProgress> {
  const existing = await ensureLessonProgress(userId, lessonId)
  if (existing.requiredRetakeCompleted) {
    return existing
  }
  const updated: LessonProgress = { ...existing, requiredRetakeCompleted: true }
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
  const masteryStatus = evaluateMastery(best.score, best.total)

  // The required retake is satisfied once a second attempt exists (the first attempt is the
  // original skill check, the second is the retake) — this is what lets a stuck learner advance.
  const requiredRetakeCompleted = existing.requiredRetakeCompleted === true || attempts >= 2

  const updated: LessonProgress = {
    ...existing,
    skillCheckCompleted: true,
    skillCheckScore: result.score,
    latestSkillCheckScore: result.score,
    highestSkillCheckScore: best.score,
    skillCheckHistory: history,
    skillCheckAttempts: attempts,
    masteryStatus,
    requiredRetakeCompleted,
  }

  await saveLessonProgress(updated)
  return updated
}
