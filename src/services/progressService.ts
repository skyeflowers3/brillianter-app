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

  const updated: LessonProgress = {
    ...existing,
    skillCheckCompleted: true,
    skillCheckScore: result.score,
    skillCheckHistory: [...(existing.skillCheckHistory ?? []), historyEntry],
  }

  await saveLessonProgress(updated)
  return updated
}
