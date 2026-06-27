import { describe, expect, it } from 'vitest'
import sc1 from '../content/questions/lesson-1-skillcheck.json'
import sc2 from '../content/questions/lesson-2-skillcheck.json'
import sc3 from '../content/questions/lesson-3-skillcheck.json'
import sc4 from '../content/questions/lesson-4-skillcheck.json'
import sc5 from '../content/questions/lesson-5-skillcheck.json'
import type { Question } from '../types/lesson'
import { randomizeSkillCheckQuestion } from './skillCheckRandomizer'
import { correctStateFor } from './correctState'
import { subtractTarget, validateQuestion } from './validation'
import { add, scale, type Vec2 } from './vectorMath'

const SKILL_CHECKS = [sc1, sc2, sc3, sc4, sc5]
const ALL_QUESTIONS = SKILL_CHECKS.flatMap((check) => check.questions) as unknown as Question[]

describe('skillCheckRandomizer', () => {
  it('produces variants that pass the real validateQuestion with a correct answer', () => {
    for (const template of ALL_QUESTIONS) {
      if (template.type === 'multipleChoice') {
        continue
      }
      for (let i = 0; i < 40; i += 1) {
        const variant = randomizeSkillCheckQuestion(template)
        const state = correctStateFor(variant)
        expect(state, `Expected a correct-state builder for ${variant.type}`).not.toBeNull()
        expect(
          validateQuestion(variant, state!),
          `Generated ${variant.type} (${variant.id}) should validate as correct`,
        ).toBe(true)
      }
    }
  })

  it('preserves the question type, id, and order', () => {
    for (const template of ALL_QUESTIONS) {
      const variant = randomizeSkillCheckQuestion(template)
      expect(variant.type).toBe(template.type)
      expect(variant.id).toBe(template.id)
      expect(variant.order).toBe(template.order)
    }
  })

  it('leaves multiple-choice questions unchanged (no number randomization)', () => {
    const mc = ALL_QUESTIONS.find((question) => question.type === 'multipleChoice')
    expect(mc).toBeDefined()
    if (mc) {
      expect(randomizeSkillCheckQuestion(mc)).toEqual(mc)
    }
  })

  it('keeps every plotted coordinate at least one unit inside the grid edge', () => {
    const within = (v: Vec2, min: number, max: number) =>
      Number.isInteger(v[0]) && Number.isInteger(v[1]) && v[0] >= min && v[0] <= max && v[1] >= min && v[1] <= max

    for (const template of ALL_QUESTIONS) {
      for (let i = 0; i < 40; i += 1) {
        const variant = randomizeSkillCheckQuestion(template)

        // readVector grid is [-6, 6] -> answer within [-5, 5].
        if (variant.type === 'readVector') {
          expect(within(variant.correctAnswer.vector, -5, 5)).toBe(true)
        }

        // headToTail grid is [-5, 5] -> vectors and the sum answer within [-4, 4].
        if (variant.type === 'headToTailFull' || variant.type === 'headToTailFree') {
          const { vectorA, vectorB } = variant.correctAnswer
          expect(within(vectorA, -4, 4)).toBe(true)
          expect(within(vectorB, -4, 4)).toBe(true)
          expect(within(add(vectorA, vectorB), -4, 4)).toBe(true)
        }

        // scalarSlider grid is [-8, 8] -> scaled answer within [-7, 7].
        if (variant.type === 'scalarSlider') {
          const { baseVector, scalar } = variant.correctAnswer
          expect(within(scale(baseVector, scalar), -7, 7)).toBe(true)
        }

        // subtraction grid is [-5, 5] -> A, B, and the A - B answer within [-4, 4].
        if (variant.type === 'vectorSubtract') {
          const { vectorA, vectorB } = variant.correctAnswer
          expect(within(vectorA, -4, 4)).toBe(true)
          expect(within(vectorB, -4, 4)).toBe(true)
          expect(within(subtractTarget(variant.correctAnswer), -4, 4)).toBe(true)
        }

        // constructCombo grid is [-8, 8] -> scaled parts and the result within [-7, 7].
        if (variant.type === 'constructCombo') {
          const { vectorA, vectorB, coefA, coefB, target } = variant.correctAnswer
          // Base vectors stay independent so findScalars has a unique (c, d).
          expect(vectorA[0] * vectorB[1] - vectorA[1] * vectorB[0]).not.toBe(0)
          expect(within(target, -7, 7)).toBe(true)
          expect(within(scale(vectorA, coefA), -7, 7)).toBe(true)
          expect(within(scale(vectorB, coefB), -7, 7)).toBe(true)
          // Target stored for display must match the engine's computed combination.
          expect(target).toEqual(add(scale(vectorA, coefA), scale(vectorB, coefB)))
        }
      }
    }
  })
})
