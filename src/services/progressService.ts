import {
  collection,
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

export async function resetLessonProgress(userId: string, lessonId: string): Promise<LessonProgress> {
  const progress = createDefaultProgress(userId, lessonId)
  await saveLessonProgress(progress)
  return progress
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
