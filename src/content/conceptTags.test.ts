import { describe, expect, it } from 'vitest'
import { CONCEPT_TAGS_BY_QUESTION, getConceptTags } from './conceptTags'
import { isConceptTag } from '../types/concepts'
import lesson1 from './questions/lesson-1.json'
import lesson2 from './questions/lesson-2.json'
import lesson3 from './questions/lesson-3.json'
import lesson4 from './questions/lesson-4.json'
import lesson5 from './questions/lesson-5.json'
import lesson1Sc from './questions/lesson-1-skillcheck.json'
import lesson2Sc from './questions/lesson-2-skillcheck.json'
import lesson3Sc from './questions/lesson-3-skillcheck.json'
import lesson4Sc from './questions/lesson-4-skillcheck.json'
import lesson5Sc from './questions/lesson-5-skillcheck.json'

type WithQuestions = { questions: { id: string }[] }

const sources: { name: string; content: WithQuestions }[] = [
  { name: 'lesson-1', content: lesson1 as WithQuestions },
  { name: 'lesson-2', content: lesson2 as WithQuestions },
  { name: 'lesson-3', content: lesson3 as WithQuestions },
  { name: 'lesson-4', content: lesson4 as WithQuestions },
  { name: 'lesson-5', content: lesson5 as WithQuestions },
  { name: 'lesson-1-skillcheck', content: lesson1Sc as WithQuestions },
  { name: 'lesson-2-skillcheck', content: lesson2Sc as WithQuestions },
  { name: 'lesson-3-skillcheck', content: lesson3Sc as WithQuestions },
  { name: 'lesson-4-skillcheck', content: lesson4Sc as WithQuestions },
  { name: 'lesson-5-skillcheck', content: lesson5Sc as WithQuestions },
]

const allQuestionIds = sources.flatMap(({ content }) => content.questions.map((q) => q.id))

describe('concept tags', () => {
  it('tags every authored lesson and skill-check question', () => {
    for (const id of allQuestionIds) {
      const tags = getConceptTags(id)
      expect(tags, `expected concept tags for question "${id}"`).not.toHaveLength(0)
    }
  })

  it('only uses valid concept tags', () => {
    for (const [id, tags] of Object.entries(CONCEPT_TAGS_BY_QUESTION)) {
      for (const tag of tags) {
        expect(isConceptTag(tag), `invalid concept tag "${tag}" on "${id}"`).toBe(true)
      }
    }
  })

  it('has exactly one interaction-mode tag per question (guided xor unguided)', () => {
    for (const id of allQuestionIds) {
      const tags = getConceptTags(id)
      const modeTags = tags.filter((tag) => tag === 'guided' || tag === 'unguided')
      expect(modeTags, `question "${id}" should have exactly one mode tag`).toHaveLength(1)
    }
  })

  it('does not contain stale ids that no longer map to a question', () => {
    const known = new Set(allQuestionIds)
    for (const id of Object.keys(CONCEPT_TAGS_BY_QUESTION)) {
      expect(known.has(id), `tag map references unknown question id "${id}"`).toBe(true)
    }
  })
})
