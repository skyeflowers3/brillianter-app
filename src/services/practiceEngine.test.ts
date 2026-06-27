import { describe, expect, it } from 'vitest'
import {
  generatePracticeQuestions,
  selectTemplatesForConcepts,
} from './practiceEngine'
import { correctStateFor } from '../lib/correctState'
import { validateQuestion } from '../lib/validation'
import type { Question } from '../types/lesson'

function asQuestion(value: unknown): Question {
  return value as Question
}

describe('selectTemplatesForConcepts', () => {
  const templates = [
    asQuestion({ id: 'a', type: 'vectorSubtract', conceptTags: ['vector-subtraction', 'negative-vectors'] }),
    asQuestion({ id: 'b', type: 'readVector', conceptTags: ['read-vector', 'coordinate-order'] }),
    asQuestion({ id: 'c', type: 'multipleChoice', conceptTags: ['scalar-multiplication'] }),
    asQuestion({ id: 'd', type: 'vectorSubtract', conceptTags: ['vector-subtraction'] }),
  ]

  it('keeps only generatable templates whose tags overlap the targets', () => {
    const result = selectTemplatesForConcepts(templates, ['vector-subtraction', 'negative-vectors'])
    expect(result.map((q) => q.id)).toEqual(['a', 'd'])
  })

  it('orders by overlap count (most relevant first)', () => {
    const result = selectTemplatesForConcepts(templates, ['vector-subtraction', 'negative-vectors'])
    // 'a' overlaps both target tags, 'd' overlaps one.
    expect(result[0].id).toBe('a')
  })

  it('excludes multiple choice even when its tags match', () => {
    const result = selectTemplatesForConcepts(templates, ['scalar-multiplication'])
    expect(result).toHaveLength(0)
  })

  it('returns nothing when no template covers the target concept', () => {
    expect(selectTemplatesForConcepts(templates, ['magnitude'])).toHaveLength(0)
  })
})

describe('generatePracticeQuestions', () => {
  it('produces the requested number of validated, concept-targeted questions', async () => {
    const questions = await generatePracticeQuestions({
      lessonId: 'lesson-4',
      targetConcepts: ['vector-subtraction'],
      count: 4,
    })

    expect(questions).toHaveLength(4)
    for (const question of questions) {
      expect(question.type).toBe('vectorSubtract')
      expect(question.conceptTags).toContain('vector-subtraction')
      const state = correctStateFor(question)
      expect(state).not.toBeNull()
      expect(validateQuestion(question, state!)).toBe(true)
    }
  })

  it('gives each generated question a unique practice id', async () => {
    const questions = await generatePracticeQuestions({
      lessonId: 'lesson-1',
      targetConcepts: ['plot-vector', 'read-vector'],
      count: 3,
    })

    expect(questions).toHaveLength(3)
    const ids = questions.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id.startsWith('practice-')).toBe(true)
    }
  })

  it('returns nothing when the lesson has no template for the target concept', async () => {
    const questions = await generatePracticeQuestions({
      lessonId: 'lesson-4',
      targetConcepts: ['magnitude'],
      count: 3,
    })
    expect(questions).toHaveLength(0)
  })

  it('returns nothing for a non-positive count', async () => {
    const questions = await generatePracticeQuestions({
      lessonId: 'lesson-4',
      targetConcepts: ['vector-subtraction'],
      count: 0,
    })
    expect(questions).toHaveLength(0)
  })
})
