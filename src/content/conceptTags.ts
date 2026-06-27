import type { ConceptTag } from '../types/concepts'

/**
 * Concept tags for every authored lesson and skill-check question, keyed by question id.
 *
 * Tags live here (rather than inline in each content JSON) so the whole taxonomy is reviewable in
 * one place and stays consistent across lessons. Tags are attached to questions at load time in
 * `questionService`, so downstream code reads them off `question.conceptTags`.
 *
 * Each entry combines: the topic skill, any structural misconception axis the question can expose
 * (e.g. `coordinate-order` for component entry), and the interaction mode (`guided` when steps are
 * checked, `unguided` when only the typed answer is graded).
 */
export const CONCEPT_TAGS_BY_QUESTION: Record<string, ConceptTag[]> = {
  // Lesson 1 — vectors, plotting, reading, magnitude
  'l1-q1': ['plot-vector', 'coordinate-order', 'guided'],
  'l1-q2': ['plot-vector', 'coordinate-order', 'guided'],
  'l1-q3': ['read-vector', 'coordinate-order', 'guided'],
  'l1-q4': ['plot-vector', 'coordinate-order', 'guided'],
  'l1-q5': ['magnitude', 'guided'],
  'l1-sc-1': ['plot-vector', 'coordinate-order', 'unguided'],
  'l1-sc-2': ['read-vector', 'coordinate-order', 'unguided'],
  'l1-sc-3': ['plot-vector', 'coordinate-order', 'unguided'],
  'l1-sc-4': ['read-vector', 'coordinate-order', 'unguided'],
  'l1-sc-5': ['plot-vector', 'coordinate-order', 'unguided'],

  // Lesson 2 — vector addition (head-to-tail)
  'l2-q1': ['vector-addition', 'head-to-tail', 'coordinate-order', 'guided'],
  'l2-q2': ['vector-addition', 'head-to-tail', 'coordinate-order', 'guided'],
  'l2-q3': ['vector-addition', 'head-to-tail', 'coordinate-order', 'guided'],
  'l2-q4': ['vector-addition', 'head-to-tail', 'coordinate-order', 'unguided'],
  'l2-q5': ['vector-addition', 'head-to-tail', 'coordinate-order', 'unguided'],
  'l2-q6': ['vector-addition', 'head-to-tail', 'coordinate-order', 'unguided'],
  'l2-sc-1': ['vector-addition', 'head-to-tail', 'coordinate-order', 'guided'],
  'l2-sc-2': ['vector-addition', 'head-to-tail', 'coordinate-order', 'unguided'],
  'l2-sc-3': ['vector-addition', 'head-to-tail', 'coordinate-order', 'unguided'],
  'l2-sc-4': ['vector-addition', 'head-to-tail', 'coordinate-order', 'unguided'],
  'l2-sc-5': ['vector-addition', 'head-to-tail', 'coordinate-order', 'unguided'],

  // Lesson 3 — scalar multiplication
  'l3-q1': ['scalar-multiplication', 'coordinate-order', 'guided'],
  'l3-q2': ['scalar-multiplication', 'coordinate-order', 'guided'],
  'l3-q3': ['scalar-multiplication', 'find-scalar', 'unguided'],
  'l3-q4': ['scalar-multiplication', 'find-scalar', 'unguided'],
  'l3-q5': ['scalar-multiplication', 'find-scalar', 'unguided'],
  'l3-sc-1': ['scalar-multiplication', 'coordinate-order', 'guided'],
  'l3-sc-2': ['scalar-multiplication', 'find-scalar', 'unguided'],
  'l3-sc-3': ['scalar-multiplication', 'unguided'],
  'l3-sc-4': ['scalar-multiplication', 'coordinate-order', 'guided'],
  'l3-sc-5': ['scalar-multiplication', 'find-scalar', 'unguided'],

  // Lesson 4 — vector subtraction
  'l4-q1': ['vector-subtraction', 'negative-vectors', 'coordinate-order', 'guided'],
  'l4-q2': ['vector-subtraction', 'negative-vectors', 'coordinate-order', 'guided'],
  'l4-q3': ['vector-subtraction', 'negative-vectors', 'coordinate-order', 'unguided'],
  'l4-q4': ['vector-subtraction', 'negative-vectors', 'coordinate-order', 'unguided'],
  'l4-q5': ['vector-subtraction', 'negative-vectors', 'coordinate-order', 'unguided'],
  'l4-sc-1': ['vector-subtraction', 'negative-vectors', 'coordinate-order', 'unguided'],
  'l4-sc-2': ['vector-subtraction', 'negative-vectors', 'coordinate-order', 'unguided'],
  'l4-sc-3': ['vector-subtraction', 'negative-vectors', 'coordinate-order', 'unguided'],
  'l4-sc-4': ['vector-subtraction', 'negative-vectors', 'coordinate-order', 'unguided'],
  'l4-sc-5': ['vector-subtraction', 'negative-vectors', 'coordinate-order', 'unguided'],

  // Lesson 5 — linear combinations
  'l5-q1': ['linear-combination', 'scalar-multiplication', 'head-to-tail', 'coordinate-order', 'guided'],
  'l5-q2': ['linear-combination', 'scalar-multiplication', 'head-to-tail', 'coordinate-order', 'guided'],
  'l5-q3': ['linear-combination', 'scalar-multiplication', 'coordinate-order', 'unguided'],
  'l5-q4': ['linear-combination', 'scalar-multiplication', 'coordinate-order', 'unguided'],
  'l5-q5': ['linear-combination', 'decompose-combination', 'find-scalar', 'unguided'],
  'l5-q6': ['linear-combination', 'decompose-combination', 'find-scalar', 'unguided'],
  'l5-sc-1': ['linear-combination', 'scalar-multiplication', 'coordinate-order', 'unguided'],
  'l5-sc-2': ['linear-combination', 'scalar-multiplication', 'coordinate-order', 'unguided'],
  'l5-sc-3': ['linear-combination', 'decompose-combination', 'find-scalar', 'unguided'],
  'l5-sc-4': ['linear-combination', 'scalar-multiplication', 'coordinate-order', 'unguided'],
  'l5-sc-5': ['linear-combination', 'decompose-combination', 'find-scalar', 'unguided'],
}

/** Concept tags for a question id, or an empty array if the id is unknown (e.g. AI-generated). */
export function getConceptTags(questionId: string): ConceptTag[] {
  return CONCEPT_TAGS_BY_QUESTION[questionId] ?? []
}
