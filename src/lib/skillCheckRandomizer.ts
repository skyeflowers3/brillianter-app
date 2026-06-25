import type {
  ConstructComboQuestion,
  DrawVectorQuestion,
  HeadToTailFreeQuestion,
  HeadToTailFullQuestion,
  Question,
  ReadVectorQuestion,
  ScalarMultiplyQuestion,
  VectorSubtractQuestion,
} from '../types/lesson'
import { add, scale, type Vec2 } from './vectorMath'

/**
 * Deterministic (no-AI) skill-check randomizer.
 *
 * For a retake it keeps each question identical in structure, interaction type, prompt wording, and
 * grid — only the numbers in the input vectors change. The correct answer is recomputed with the
 * same math engine the validators use (`add`/`scale`), so grading goes through the exact same
 * `validateQuestion` path as the original. `multipleChoice` (and any unrecognized type) is returned
 * unchanged because its options are authored text, not numbers.
 */

// Authored content uses the Unicode minus sign and angle brackets; match them so retakes read the
// same as the originals.
const MINUS = '\u2212'
const APOS = '\u2019'

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function nonZeroInt(min: number, max: number): number {
  let value = 0
  while (value === 0) {
    value = randInt(min, max)
  }
  return value
}

function choice<T>(items: T[]): T {
  return items[randInt(0, items.length - 1)]
}

function inBounds(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

function vecInBounds([x, y]: Vec2, min: number, max: number): boolean {
  return inBounds(x, min, max) && inBounds(y, min, max)
}

function vecEquals(a: Vec2, b: Vec2): boolean {
  return a[0] === b[0] && a[1] === b[1]
}

function fmtNum(n: number): string {
  return n < 0 ? `${MINUS}${Math.abs(n)}` : `${n}`
}

function fmtVec([x, y]: Vec2): string {
  return `\u27e8${fmtNum(x)}, ${fmtNum(y)}\u27e9`
}

/** Second addend of a component sum: parenthesize negatives like the authored content ("(\u22121)"). */
function fmtAddend(n: number): string {
  return n < 0 ? `(${MINUS}${Math.abs(n)})` : `${n}`
}

function fmtComponentSum(a: number, b: number): string {
  return `${fmtNum(a)} + ${fmtAddend(b)}`
}

/** "3 left and 2 up" style description, optionally with the word "units". */
function movePhrase([x, y]: Vec2, withUnits: boolean): string {
  const unit = withUnits ? ' units' : ''
  const parts: string[] = []
  if (x !== 0) {
    parts.push(`${Math.abs(x)}${unit} ${x < 0 ? 'left' : 'right'}`)
  }
  if (y !== 0) {
    parts.push(`${Math.abs(y)}${unit} ${y < 0 ? 'down' : 'up'}`)
  }
  return parts.length > 0 ? parts.join(' and ') : `0${unit}`
}

/** Format a coefficient applied to a named vector: 1->"A", -1->"\u2212A", n->"nA". */
function coefTerm(coef: number, name: string): string {
  if (coef === 1) {
    return name
  }
  if (coef === -1) {
    return `${MINUS}${name}`
  }
  return `${fmtNum(coef)}${name}`
}

/** Full "cA + dB" expression, joining with + or \u2212 like the authored labels. */
function comboExpression(coefA: number, coefB: number): string {
  const first = coefTerm(coefA, 'A')
  const second =
    coefB >= 0 ? ` + ${coefTerm(coefB, 'B')}` : ` ${MINUS} ${coefTerm(Math.abs(coefB), 'B')}`
  return first + second
}

function det(a: Vec2, b: Vec2): number {
  return a[0] * b[1] - a[1] * b[0]
}

const MAX_ATTEMPTS = 300

// --- Per-type randomizers --------------------------------------------------

function randomizeDrawVector(question: DrawVectorQuestion): DrawVectorQuestion {
  const isMagnitudeDirection = /magnitude/i.test(question.prompt) && /direction/i.test(question.prompt)

  if (isMagnitudeDirection) {
    const m = randInt(2, 6)
    const option = choice([
      { deg: 0, vec: [m, 0] as Vec2, points: 'right', move: 'right' },
      { deg: 90, vec: [0, m] as Vec2, points: 'straight up', move: 'up' },
      { deg: 180, vec: [-m, 0] as Vec2, points: 'left', move: 'left' },
      { deg: 270, vec: [0, -m] as Vec2, points: 'straight down', move: 'down' },
    ])

    return {
      ...question,
      prompt: `Draw a vector with magnitude ${m} and direction ${option.deg}\u00b0.`,
      hint: `Direction ${option.deg}\u00b0 points ${option.points}. A magnitude of ${m} means the arrow is ${m} units long, so move ${m} units ${option.move}.`,
      explanation: `${option.deg}\u00b0 points ${option.points}, and magnitude ${m} means a length of ${m}. So the vector is ${fmtVec(option.vec)}.`,
      correctAnswer: { ...question.correctAnswer, target: option.vec },
    }
  }

  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const target: Vec2 = [randInt(-7, 7), randInt(-7, 7)]
    if (vecEquals(target, [0, 0]) || vecEquals(target, question.correctAnswer.target ?? [0, 0])) {
      continue
    }

    return {
      ...question,
      prompt: `Draw the vector ${fmtVec(target)}.`,
      hint: `The first number is the horizontal move and the second is the vertical move. ${fmtVec(target)} means ${movePhrase(target, false)}.`,
      explanation: `${fmtVec(target)} moves ${movePhrase(target, true)}, so the tip lands at (${fmtNum(target[0])}, ${fmtNum(target[1])}). The first number controls left/right movement and the second controls up/down.`,
      correctAnswer: { ...question.correctAnswer, target },
    }
  }

  return question
}

function randomizeReadVector(question: ReadVectorQuestion): ReadVectorQuestion {
  // Plane is [-6, 6]; keep the answer one unit inside the edge so the arrow head never sits on it.
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const vector: Vec2 = [nonZeroInt(-5, 5), nonZeroInt(-5, 5)]
    if (vecEquals(vector, question.correctAnswer.vector)) {
      continue
    }

    return {
      ...question,
      explanation: `The arrow moves ${movePhrase(vector, true)} from the origin, so it is the vector ${fmtVec(vector)}.`,
      correctAnswer: { ...question.correctAnswer, vector },
    }
  }

  return question
}

function randomizeHeadToTail<T extends HeadToTailFullQuestion | HeadToTailFreeQuestion>(
  question: T,
): T {
  // Grid is [-5, 5]; keep both vectors and their sum one unit inside the edge ([-4, 4]).
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const vectorA: Vec2 = [nonZeroInt(-4, 4), nonZeroInt(-4, 4)]
    const vectorB: Vec2 = [nonZeroInt(-4, 4), nonZeroInt(-4, 4)]
    const sum = add(vectorA, vectorB)

    if (!vecInBounds(sum, -4, 4)) {
      continue
    }
    if (vecEquals(vectorA, question.correctAnswer.vectorA) && vecEquals(vectorB, question.correctAnswer.vectorB)) {
      continue
    }

    const isFull = question.type === 'headToTailFull'
    const prompt = isFull
      ? `Here a = ${fmtVec(vectorA)} and b = ${fmtVec(vectorB)} both start at the origin. Align them head-to-tail, draw a + b, then enter what a + b is.`
      : `Now try it on your own! Here a = ${fmtVec(vectorA)} and b = ${fmtVec(vectorB)}. Move the vectors to find the path, then enter what a + b is.`

    return {
      ...question,
      prompt,
      explanation: `Connect a and b head-to-tail, then a + b is the arrow from the start to the end of the path. Add the matching components: ${fmtVec(vectorA)} + ${fmtVec(vectorB)} = \u27e8${fmtComponentSum(vectorA[0], vectorB[0])}, ${fmtComponentSum(vectorA[1], vectorB[1])}\u27e9 = ${fmtVec(sum)}.`,
      correctAnswer: { ...question.correctAnswer, vectorA, vectorB },
    } as T
  }

  return question
}

function randomizeScalar(question: ScalarMultiplyQuestion): ScalarMultiplyQuestion {
  const sliderMin = question.slider?.min ?? -4
  const sliderMax = question.slider?.max ?? 4

  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    // Both components non-zero keeps the hints/explanations natural.
    const base: Vec2 = [nonZeroInt(-3, 3), nonZeroInt(-3, 3)]
    // createVector mode demonstrates a positive stretch; findScalar can flip direction.
    const scalar =
      question.mode === 'createVector'
        ? randInt(2, 4)
        : choice([-4, -3, -2, -1, 2, 3, 4])

    if (!inBounds(scalar, sliderMin, sliderMax)) {
      continue
    }

    // Plane is [-8, 8]; keep the scaled vector one unit inside the edge ([-7, 7]).
    const target = scale(base, scalar)
    if (!vecInBounds(target, -7, 7)) {
      continue
    }
    if (vecEquals(base, question.correctAnswer.baseVector) && scalar === question.correctAnswer.scalar) {
      continue
    }

    const referenceLabel = `A = ${fmtVec(base)}`

    if (question.mode === 'createVector') {
      return {
        ...question,
        referenceLabel,
        prompt: `Drag the head of the vector to create ${scalar}A, then enter the resulting vector.`,
        hint: `${scalar}A multiplies each component of A by ${scalar}. Drag the head outward until c = ${scalar} and read off \u27e8${scalar}\u00b7${fmtNum(base[0])}, ${scalar}\u00b7${fmtNum(base[1])}\u27e9.`,
        explanation: `${scalar} \u00b7 ${fmtVec(base)} = \u27e8${scalar}\u00b7${fmtNum(base[0])}, ${scalar}\u00b7${fmtNum(base[1])}\u27e9 = ${fmtVec(target)}. Multiplying by a positive scalar stretches the length while the direction stays the same.`,
        correctAnswer: { ...question.correctAnswer, baseVector: base, scalar },
      }
    }

    const directionNote = scalar < 0 ? ' and points the opposite way' : ''
    return {
      ...question,
      referenceLabel,
      prompt: `Drag the head of the vector until c\u00b7A matches ${fmtVec(target)}, then enter the scalar c.`,
      hint: `${fmtVec(target)} is ${Math.abs(scalar)} times as long as A${directionNote}, so c must be ${scalar < 0 ? 'negative' : 'positive'}. What number times ${fmtNum(base[0])} gives ${fmtNum(target[0])}?`,
      explanation: `c \u00b7 ${fmtVec(base)} = ${fmtVec(target)} means ${fmtNum(base[0])}c = ${fmtNum(target[0])} and ${fmtNum(base[1])}c = ${fmtNum(target[1])}, so c = ${fmtNum(scalar)}.`,
      correctAnswer: { ...question.correctAnswer, baseVector: base, scalar },
    }
  }

  return question
}

function randomizeSubtract(question: VectorSubtractQuestion): VectorSubtractQuestion {
  // Grid is [-5, 5]; keep A, B, \u2212B, and the A \u2212 B answer one unit inside the edge ([-4, 4])
  // so the result never lands on the edge of the graph where it can't be reached.
  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const vectorA: Vec2 = [nonZeroInt(-4, 4), nonZeroInt(-4, 4)]
    const vectorB: Vec2 = [nonZeroInt(-4, 4), nonZeroInt(-4, 4)]
    const negB = scale(vectorB, -1)
    const result = add(vectorA, negB)

    if (!vecInBounds(result, -4, 4) || vecEquals(result, [0, 0])) {
      continue
    }
    if (vecEquals(vectorA, question.correctAnswer.vectorA) && vecEquals(vectorB, question.correctAnswer.vectorB)) {
      continue
    }

    return {
      ...question,
      referenceLabel: `A = ${fmtVec(vectorA)}, B = ${fmtVec(vectorB)}`,
      hint: `Reverse B to get \u2212B = ${fmtVec(negB)}, connect it head-to-tail to A, draw the result, then enter A \u2212 B.`,
      explanation: `A \u2212 B = A + (\u2212B) = ${fmtVec(vectorA)} + ${fmtVec(negB)} = ${fmtVec(result)}.`,
      correctAnswer: { ...question.correctAnswer, vectorA, vectorB },
    }
  }

  return question
}

function randomizeConstruct(question: ConstructComboQuestion): ConstructComboQuestion {
  // Keep everything drawn one unit inside the grid edge so the result is always reachable.
  const innerMin = (question.planeMin ?? -8) + 1
  const innerMax = (question.planeMax ?? 8) - 1
  const coefMin = question.coefficient?.min ?? -4
  const coefMax = question.coefficient?.max ?? 4

  for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
    const vectorA: Vec2 = [nonZeroInt(-3, 3), nonZeroInt(-3, 3)]
    const vectorB: Vec2 = [nonZeroInt(-3, 3), nonZeroInt(-3, 3)]

    // Base vectors must be linearly independent so findScalars has a unique (c, d) solution.
    if (det(vectorA, vectorB) === 0) {
      continue
    }

    const coefA = nonZeroInt(coefMin, coefMax)
    const coefB = nonZeroInt(coefMin, coefMax)
    const scaledA = scale(vectorA, coefA)
    const scaledB = scale(vectorB, coefB)
    const target = add(scaledA, scaledB)

    // Everything drawn (the two scaled vectors and the result) must fit one unit inside the grid.
    if (!vecInBounds(scaledA, innerMin, innerMax) || !vecInBounds(scaledB, innerMin, innerMax)) {
      continue
    }
    if (!vecInBounds(target, innerMin, innerMax)) {
      continue
    }

    const expression = comboExpression(coefA, coefB)
    const referenceLabel = `A = ${fmtVec(vectorA)}, B = ${fmtVec(vectorB)}`
    const correctAnswer = { ...question.correctAnswer, vectorA, vectorB, coefA, coefB, target }

    if (question.mode === 'findScalars') {
      return {
        ...question,
        referenceLabel,
        prompt: `What scalars c and d make c\u00b7A + d\u00b7B = ${fmtVec(target)}? Fill them in below \u2014 use the grid to scale and connect if it helps.`,
        hint: `Scale A and B until the path lands on ${fmtVec(target)}. The scale factor on A is c, and the one on B is d.`,
        explanation: `${fmtVec(target)} = ${fmtNum(coefA)}\u00b7${fmtVec(vectorA)} + ${fmtNum(coefB)}\u00b7${fmtVec(vectorB)} = ${fmtVec(scaledA)} + ${fmtVec(scaledB)}, so c = ${fmtNum(coefA)} and d = ${fmtNum(coefB)}.`,
        correctAnswer,
      }
    }

    return {
      ...question,
      referenceLabel,
      expressionLabel: expression,
      prompt: `What is ${expression}? Fill in the vector${APOS}s components below \u2014 use the grid if it helps.`,
      hint: `Scale A by ${fmtNum(coefA)} and B by ${fmtNum(coefB)}, then connect them head-to-tail.`,
      explanation: `${expression} = ${fmtVec(scaledA)} + ${fmtVec(scaledB)} = ${fmtVec(target)}.`,
      correctAnswer,
    }
  }

  return question
}

/** Returns a randomized variant of a single skill-check question (or the original if unsupported). */
export function randomizeSkillCheckQuestion(question: Question): Question {
  switch (question.type) {
    case 'drawVector':
      return randomizeDrawVector(question)
    case 'readVector':
      return randomizeReadVector(question)
    case 'headToTailFull':
    case 'headToTailFree':
      return randomizeHeadToTail(question)
    case 'scalarSlider':
      return randomizeScalar(question)
    case 'vectorSubtract':
      return randomizeSubtract(question)
    case 'constructCombo':
      return randomizeConstruct(question)
    default:
      // multipleChoice and any unrecognized type keep their authored content.
      return question
  }
}

/** Randomizes every question in a skill check, preserving order and ids. */
export function randomizeSkillCheck(questions: Question[]): Question[] {
  return questions.map(randomizeSkillCheckQuestion)
}
