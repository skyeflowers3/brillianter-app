import type { Question } from '../types/lesson'
import type { ConceptTag } from '../types/concepts'
import { fetchQuestions, loadSkillCheckContent } from './questionService'
import { randomizeSkillCheckQuestion } from '../lib/skillCheckRandomizer'
import { correctStateFor } from '../lib/correctState'
import { validateQuestion } from '../lib/validation'
import { generatePractice } from './aiQuestionGenerator'
import { getMasteryProfile, getWeakConcepts, getFollowUpConcepts } from './masteryProfileService'

/**
 * Personalized practice engine.
 *
 * Given a lesson and a set of weak concepts, it produces fresh, validated practice questions that
 * *target those concepts* (not random ones). It never invents new interaction types: it reuses the
 * lesson's authored question templates, varies their numbers with the same validated generator the
 * skill-check retakes use (local math computes the answer; the real `validateQuestion` verifies it),
 * and only returns questions that pass. The AI layer's role is to pick/prioritize which templates to
 * practice (and, once wired, propose parameters); correctness always stays with the local engine.
 *
 * This same engine powers both remediation (after a failed skill check) and the optional Improve
 * Mastery mode.
 */

export interface PracticeRequest {
  lessonId: string
  /** The concepts to drill — typically the learner's weak/needs-follow-up concepts. */
  targetConcepts: ConceptTag[]
  /** How many practice questions to produce. */
  count: number
}

/** Question types the engine can vary and verify (matches the randomizer + correct-state builder). */
const GENERATABLE_TYPES = new Set<Question['type']>([
  'drawVector',
  'readVector',
  'findMagnitude',
  'headToTailFull',
  'headToTailFree',
  'scalarSlider',
  'vectorSubtract',
  'constructCombo',
])

const MAX_VARIANT_ATTEMPTS = 12

function isGeneratable(question: Question): boolean {
  return GENERATABLE_TYPES.has(question.type)
}

function conceptOverlap(question: Question, targets: ReadonlySet<string>): number {
  return (question.conceptTags ?? []).reduce(
    (count, tag) => (targets.has(tag) ? count + 1 : count),
    0,
  )
}

/** All authored templates for a lesson: its lesson questions plus its skill-check questions. */
export async function collectTemplates(lessonId: string): Promise<Question[]> {
  const [lessonQuestions, skillCheck] = await Promise.all([
    fetchQuestions(lessonId),
    loadSkillCheckContent(lessonId),
  ])
  return [...lessonQuestions, ...(skillCheck?.questions ?? [])]
}

/**
 * Generatable templates whose concept tags overlap the target concepts, most-relevant first.
 * Exposed for testing and reuse.
 */
export function selectTemplatesForConcepts(
  templates: Question[],
  targetConcepts: ConceptTag[],
): Question[] {
  const targets = new Set<string>(targetConcepts)
  return templates
    .filter((question) => isGeneratable(question) && conceptOverlap(question, targets) > 0)
    .sort((a, b) => conceptOverlap(b, targets) - conceptOverlap(a, targets))
}

/** True only when the generated question grades its own computed answer as correct. */
function verifyGenerated(question: Question): boolean {
  const state = correctStateFor(question)
  if (!state) {
    return false
  }
  try {
    return validateQuestion(question, state)
  } catch {
    return false
  }
}

/** Produce one validated variant of a template, or null if none passed within the attempt budget. */
function buildValidatedVariant(template: Question): Question | null {
  for (let attempt = 0; attempt < MAX_VARIANT_ATTEMPTS; attempt += 1) {
    const variant = randomizeSkillCheckQuestion(template)
    if (verifyGenerated(variant)) {
      return variant
    }
  }
  return null
}

/** Order matching templates using the AI's proposal order, keeping any it didn't mention. */
function orderByProposals(matching: Question[], proposalIds: string[]): Question[] {
  if (proposalIds.length === 0) {
    return matching
  }
  const byId = new Map(matching.map((question) => [question.id, question]))
  const ordered: Question[] = []
  const seen = new Set<string>()
  for (const id of proposalIds) {
    const question = byId.get(id)
    if (question && !seen.has(id)) {
      ordered.push(question)
      seen.add(id)
    }
  }
  for (const question of matching) {
    if (!seen.has(question.id)) {
      ordered.push(question)
    }
  }
  return ordered
}

function finalizePracticeQuestion(variant: Question, index: number): Question {
  // Fresh id so a practice question never collides with real saved progress; preserve concept tags.
  return { ...variant, id: `practice-${variant.id}-${index + 1}`, order: index }
}

/**
 * Generate `count` validated practice questions for the given lesson, targeting the supplied
 * concepts. Returns fewer (possibly zero) when the lesson has no matching generatable templates.
 */
export async function generatePracticeQuestions(request: PracticeRequest): Promise<Question[]> {
  if (request.count <= 0) {
    return []
  }

  const templates = await collectTemplates(request.lessonId)
  const matching = selectTemplatesForConcepts(templates, request.targetConcepts)
  if (matching.length === 0) {
    return []
  }

  // Let the AI pick/prioritize which templates to practice (the mock simply echoes them). Parameter
  // proposals are honored once the cloud provider is wired; until then we vary numbers locally.
  const ai = await generatePractice({
    lessonId: request.lessonId,
    targetConcepts: request.targetConcepts,
    templateQuestionIds: matching.map((question) => question.id),
    count: request.count,
  })
  const ordered = orderByProposals(matching, ai.proposals.map((proposal) => proposal.templateQuestionId))

  const questions: Question[] = []
  // Cycle through the ordered templates until we have enough (or exhaust a sane attempt budget).
  const maxRounds = request.count * 2 + ordered.length
  for (let round = 0; round < maxRounds && questions.length < request.count; round += 1) {
    const template = ordered[round % ordered.length]
    const variant = buildValidatedVariant(template)
    if (variant) {
      questions.push(finalizePracticeQuestion(variant, questions.length))
    }
  }

  return questions
}

/**
 * Authored-question fallback. When a lesson's templates can't be auto-varied (e.g. the head-to-tail
 * addition types aren't in GENERATABLE_TYPES), we still want a full set of guided practice problems
 * between the refresher and the skill-check retake. This reuses the authored lesson/skill-check
 * questions verbatim — concept-matched first — so the practice step is never empty.
 */
function buildAuthoredFallback(
  templates: Question[],
  targetConcepts: ConceptTag[],
  count: number,
  startIndex: number,
): Question[] {
  if (count <= 0) {
    return []
  }
  const targets = new Set<string>(targetConcepts)
  const ranked = [...templates].sort(
    (a, b) => conceptOverlap(b, targets) - conceptOverlap(a, targets),
  )
  return ranked
    .slice(0, count)
    .map((template, offset) => finalizePracticeQuestion(template, startIndex + offset))
}

/**
 * Convenience: generate practice for a learner by reading their weak concepts from the mastery
 * profile. Falls back to follow-up concepts, then to every concept the lesson covers, so a session
 * is always produced even before the profile has much signal.
 */
export async function generatePracticeForLesson(
  userId: string,
  lessonId: string,
  count: number,
): Promise<Question[]> {
  const profile = await getMasteryProfile(userId)
  const weak = getWeakConcepts(profile).map((stat) => stat.concept)
  const followUp = getFollowUpConcepts(profile).map((stat) => stat.concept)

  const templates = await collectTemplates(lessonId)
  let targetConcepts: ConceptTag[] = weak.length > 0 ? weak : followUp
  if (targetConcepts.length === 0) {
    // No signal yet: practice everything this lesson covers.
    targetConcepts = [...new Set(templates.flatMap((question) => question.conceptTags ?? []))]
  }

  const generated = await generatePracticeQuestions({ lessonId, targetConcepts, count })
  if (generated.length >= count) {
    return generated
  }

  // Top up with authored questions so the learner always gets a real set of guided practice
  // problems (with tutor tips) before being sent back to the skill check.
  const fallback = buildAuthoredFallback(
    templates,
    targetConcepts,
    count - generated.length,
    generated.length,
  )
  return [...generated, ...fallback]
}
