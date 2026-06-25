import { readFileSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

const LESSON_QUESTION_FILES: Record<string, string> = {
  'lesson-1': 'src/content/questions/lesson-1.json',
  'lesson-2': 'src/content/questions/lesson-2.json',
  'lesson-3': 'src/content/questions/lesson-3.json',
  'lesson-4': 'src/content/questions/lesson-4.json',
  'lesson-5': 'src/content/questions/lesson-5.json',
}

function resolvePath(relativeOrAbsolutePath: string): string {
  return isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : join(rootDir, relativeOrAbsolutePath)
}

function readJson<T>(relativePath: string): T {
  const contents = readFileSync(join(rootDir, relativePath), 'utf8')
  return JSON.parse(contents) as T
}

function readServiceAccount(pathFromEnv: string): ServiceAccount {
  const resolvedPath = resolvePath(pathFromEnv)
  const contents = readFileSync(resolvedPath, 'utf8')
  return JSON.parse(contents) as ServiceAccount
}

function initializeAdmin() {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH

  if (serviceAccountPath) {
    const serviceAccount = readServiceAccount(serviceAccountPath)
    return initializeApp({
      credential: cert(serviceAccount),
    })
  }

  return initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID ?? 'brillianter-app',
  })
}

async function seedFirestore() {
  initializeAdmin()
  const db = getFirestore()

  const lessons = readJson<Array<Record<string, unknown>>>('src/content/lessons.json')

  console.log(`Seeding ${lessons.length} lessons...`)

  for (const lesson of lessons) {
    const lessonId = String(lesson.lessonId)
    await db.collection('lessons').doc(lessonId).set(lesson, { merge: true })
    console.log(`  ✓ lessons/${lessonId}`)
  }

  for (const [lessonId, questionFile] of Object.entries(LESSON_QUESTION_FILES)) {
    const lessonContent = readJson<{ questions: Array<Record<string, unknown>> }>(questionFile)

    console.log(`Seeding ${lessonContent.questions.length} questions for ${lessonId}...`)

    for (const question of lessonContent.questions) {
      const questionId = String(question.id)
      // Full overwrite (no merge) so a question that changes shape — e.g. dropping a second vector
      // or switching type — never keeps stale fields from a previous seed.
      await db
        .collection('questions')
        .doc(questionId)
        .set({ ...question, lessonId, isSkillCheck: false })
      console.log(`  ✓ questions/${questionId}`)
    }
  }

  console.log('Seed complete.')
}

seedFirestore().catch((error) => {
  console.error('Seed failed.')
  console.error(error)
  console.error('\nSetup:')
  console.error('  1. Download a Firebase service account key from Project Settings → Service accounts')
  console.error('  2. Save it as serviceAccount.json in the project root')
  console.error('  3. Run: FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccount.json npm run seed')
  process.exit(1)
})
