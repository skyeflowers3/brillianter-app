import type {
  HeadToTailAddQuestion,
  HeadToTailAddState,
  HeadToTailInteractionMode,
  HeadToTailStep,
} from '../types/lesson'
import { add, type Vec2 } from './vectorMath'

const DEFAULT_TIP: Vec2 = [0, 0]

/** Map any legacy Firestore/local mode to the current lesson-2 format. */
const LEGACY_MODE_MAP: Record<string, HeadToTailInteractionMode> = {
  inputSum: 'fixedAB_drawSum',
  inputA: 'fixedAB_drawSum',
  inputB: 'fixedAB_drawSum',
  drawSum: 'fixedAB_drawSum',
  drawA: 'fixedAB_drawSum',
  drawB: 'fixedAB_drawSum',
  fixedA_drawB_then_drawSum: 'fixedAB_drawSum',
  drawA_drawB_drawSum: 'fixedAB_drawSum',
}

export function normalizeInteractionMode(
  question: HeadToTailAddQuestion,
): HeadToTailInteractionMode {
  const mode = question.interactionMode as string
  if (mode === 'fixedAB_drawSum') {
    return 'fixedAB_drawSum'
  }

  return LEGACY_MODE_MAP[mode] ?? 'fixedAB_drawSum'
}

export function getStepsForMode(mode: HeadToTailInteractionMode): HeadToTailStep[] {
  if (mode === 'fixedAB_drawSum') {
    return ['drawSum']
  }

  if (mode === 'fixedA_drawB_then_drawSum') {
    return ['drawB', 'drawSum']
  }

  return ['drawA', 'drawB', 'drawSum']
}

export function getQuestionSteps(question: HeadToTailAddQuestion): HeadToTailStep[] {
  return getStepsForMode(normalizeInteractionMode(question))
}

export function getStepPrompt(question: HeadToTailAddQuestion, step: HeadToTailStep): string {
  return question.stepPrompts?.[step] ?? question.prompt
}

export function getStepHint(question: HeadToTailAddQuestion, step: HeadToTailStep): string {
  return question.stepHints?.[step] ?? question.hint
}

export function hasNextStep(
  question: HeadToTailAddQuestion,
  state: HeadToTailAddState,
): boolean {
  if (normalizeInteractionMode(question) === 'fixedAB_drawSum') {
    return false
  }

  const steps = getQuestionSteps(question)
  const index = steps.indexOf(state.step)
  return index >= 0 && index < steps.length - 1
}

export function advanceStepState(
  question: HeadToTailAddQuestion,
  state: HeadToTailAddState,
): HeadToTailAddState | null {
  const steps = getQuestionSteps(question)
  const index = steps.indexOf(state.step)

  if (index === -1 || index >= steps.length - 1) {
    return null
  }

  const nextStep = steps[index + 1]

  return {
    ...state,
    step: nextStep,
    sumTip:
      nextStep === 'drawSum'
        ? [...DEFAULT_TIP]
        : add(state.vectorA, state.vectorB),
  }
}

export function presetVectorA(question: HeadToTailAddQuestion): Vec2 {
  return question.correctAnswer.vectorA
    ? [...question.correctAnswer.vectorA]
    : [2, 0]
}

export function presetVectorB(question: HeadToTailAddQuestion): Vec2 {
  return question.correctAnswer.vectorB
    ? [...question.correctAnswer.vectorB]
    : [0, 2]
}

export function fixedVectorAForStep(
  question: HeadToTailAddQuestion,
  state: HeadToTailAddState,
): Vec2 | null {
  if (normalizeInteractionMode(question) === 'fixedAB_drawSum') {
    return presetVectorA(question)
  }

  if (state.step === 'drawA') {
    return null
  }

  const mode = normalizeInteractionMode(question)
  if (mode === 'fixedA_drawB_then_drawSum') {
    return presetVectorA(question)
  }

  return [...state.vectorA]
}

export function fixedVectorBForStep(
  question: HeadToTailAddQuestion,
  state: HeadToTailAddState,
): Vec2 | null {
  if (normalizeInteractionMode(question) === 'fixedAB_drawSum') {
    return presetVectorB(question)
  }

  if (state.step === 'drawA' || state.step === 'drawB') {
    return null
  }

  return [...state.vectorB]
}
