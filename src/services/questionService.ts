import lesson1 from '../content/questions/lesson-1.json'
import lesson2 from '../content/questions/lesson-2.json'
import lesson3 from '../content/questions/lesson-3.json'
import lesson4 from '../content/questions/lesson-4.json'
import lesson5 from '../content/questions/lesson-5.json'
import lesson1SkillCheck from '../content/questions/lesson-1-skillcheck.json'
import lesson2SkillCheck from '../content/questions/lesson-2-skillcheck.json'
import lesson3SkillCheck from '../content/questions/lesson-3-skillcheck.json'
import lesson4SkillCheck from '../content/questions/lesson-4-skillcheck.json'
import lesson5SkillCheck from '../content/questions/lesson-5-skillcheck.json'
import { fetchLessons } from './lessonService'
import type { LessonContent, Question } from '../types/lesson'
import { getConceptTags } from '../content/conceptTags'

/**
 * Attach concept tags (from the central tag map) to each question so downstream code can read them
 * off `question.conceptTags`. An authored question's own tags, if present, take precedence.
 */
function withConceptTags(questions: Question[]): Question[] {
  return questions.map((question) => ({
    ...question,
    conceptTags: question.conceptTags ?? getConceptTags(question.id),
  }))
}

const localQuestions: Record<string, Question[]> = {
  'lesson-1': (lesson1 as LessonContent).questions,
  'lesson-2': (lesson2 as LessonContent).questions,
  'lesson-3': (lesson3 as LessonContent).questions,
  'lesson-4': (lesson4 as LessonContent).questions,
  'lesson-5': (lesson5 as unknown as LessonContent).questions,
}

const localIntros: Record<string, LessonContent['intro']> = {
  'lesson-1': (lesson1 as LessonContent).intro,
  'lesson-2': (lesson2 as LessonContent).intro,
  'lesson-3': (lesson3 as LessonContent).intro,
  'lesson-4': (lesson4 as LessonContent).intro,
  'lesson-5': (lesson5 as unknown as LessonContent).intro,
}

const localInterstitials: Record<string, LessonContent['interstitials']> = {
  'lesson-1': (lesson1 as LessonContent).interstitials,
  'lesson-2': (lesson2 as LessonContent).interstitials,
  'lesson-3': (lesson3 as LessonContent).interstitials,
  'lesson-4': (lesson4 as LessonContent).interstitials,
  'lesson-5': (lesson5 as unknown as LessonContent).interstitials,
}

// Skill-check JSON questions carry an extra `isSkillCheck` flag that widens TS's inferred JSON
// type, so we cast through `unknown` (the shapes are validated to match the question schemas).
const localSkillChecks: Record<string, LessonContent> = {
  'lesson-1': lesson1SkillCheck as unknown as LessonContent,
  'lesson-2': lesson2SkillCheck as unknown as LessonContent,
  'lesson-3': lesson3SkillCheck as unknown as LessonContent,
  'lesson-4': lesson4SkillCheck as unknown as LessonContent,
  'lesson-5': lesson5SkillCheck as unknown as LessonContent,
}

function getLocalIntro(lessonId: string): LessonContent['intro'] {
  return localIntros[lessonId]
}

function getLocalInterstitials(lessonId: string): LessonContent['interstitials'] {
  return localInterstitials[lessonId]
}

function getLocalQuestions(lessonId: string): Question[] {
  const questions = localQuestions[lessonId]

  if (!questions) {
    return []
  }

  return withConceptTags([...questions].sort((a, b) => a.order - b.order))
}

/**
 * Questions ship in the app bundle, so this resolves instantly with no network round-trip.
 * Firestore is reserved for per-user data (auth, progress); updating questions requires a redeploy.
 */
export async function fetchQuestions(lessonId: string): Promise<Question[]> {
  return getLocalQuestions(lessonId)
}

export async function loadLessonContent(lessonId: string): Promise<LessonContent | null> {
  const questions = await fetchQuestions(lessonId)

  if (questions.length === 0) {
    return null
  }

  const lessons = await fetchLessons()
  const metadata = lessons.find((lesson) => lesson.lessonId === lessonId)

  if (!metadata) {
    return null
  }

  return {
    lessonId: metadata.lessonId,
    title: metadata.title,
    topic: metadata.topic,
    questions,
    intro: getLocalIntro(lessonId),
    interstitials: getLocalInterstitials(lessonId),
  }
}

/**
 * Skill-check questions live in dedicated local JSON files (lesson-*-skillcheck.json). They are
 * intentionally not seeded to Firestore — a skill check is a short, self-contained quiz that
 * reuses the lesson's question types with fresh numbers.
 */
export async function loadSkillCheckContent(lessonId: string): Promise<LessonContent | null> {
  const content = localSkillChecks[lessonId]

  if (!content || content.questions.length === 0) {
    return null
  }

  return {
    ...content,
    questions: withConceptTags([...content.questions].sort((a, b) => a.order - b.order)),
  }
}
