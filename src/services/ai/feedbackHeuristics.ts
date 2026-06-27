/**
 * Deterministic, offline heuristics for diagnosing a wrong 2D vector answer. Shared by the mock
 * provider (so demos feel personalized without a network call) and by the feedback service's static
 * fallback (so feedback is still specific even when the real model is unavailable).
 */

function asVec2(value: unknown): [number, number] | null {
  if (Array.isArray(value) && value.length === 2 && value.every((n) => typeof n === 'number')) {
    return [value[0] as number, value[1] as number]
  }
  return null
}

/** Best-effort description of a 2D vector mistake; null when the answer isn't a 2D vector or matches. */
export function describeVectorMistake(submitted: unknown, correct: unknown): string | null {
  const a = asVec2(submitted)
  const b = asVec2(correct)
  if (!a || !b) {
    return null
  }
  if (a[0] === b[0] && a[1] === b[1]) {
    return null
  }
  if (a[0] === b[1] && a[1] === b[0]) {
    return `It looks like you swapped the coordinates. You entered (${a[0]}, ${a[1]}), but the order matters — the correct answer is (${b[0]}, ${b[1]}).`
  }
  if (a[0] === -b[0] && a[1] === b[1]) {
    return `Your up/down move is right, but the first coordinate has the wrong sign. Check the left/right direction: it should be ${b[0]}, not ${a[0]}.`
  }
  if (a[1] === -b[1] && a[0] === b[0]) {
    return `Your left/right move is right, but the second coordinate has the wrong sign. Check the up/down direction: it should be ${b[1]}, not ${a[1]}.`
  }
  if (a[0] !== b[0] && a[1] === b[1]) {
    return `The up/down part is correct, but the first coordinate is off — it should be ${b[0]}, not ${a[0]}.`
  }
  if (a[1] !== b[1] && a[0] === b[0]) {
    return `The left/right part is correct, but the second coordinate is off — it should be ${b[1]}, not ${a[1]}.`
  }
  return `You entered (${a[0]}, ${a[1]}), but the correct answer is (${b[0]}, ${b[1]}). Compare each coordinate and try again.`
}
