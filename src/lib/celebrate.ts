import confetti from 'canvas-confetti'

const COLORS = ['#aa3bff', '#7c3aed', '#2563eb', '#15803d', '#f59e0b']

/**
 * Celebration intensity, kept proportional to the achievement so the effect stays meaningful:
 * - `full`   — a perfect skill check (3/3). The big moment: center burst + side streamers.
 * - `light`  — a strong-but-imperfect skill check (e.g. 2/3). A single modest burst.
 * - `gentle` — finishing a lesson's questions. A small nod that never out-celebrates a 3/3.
 */
export type CelebrationIntensity = 'full' | 'light' | 'gentle'

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function fireCelebration(intensity: CelebrationIntensity): void {
  if (typeof window === 'undefined' || prefersReducedMotion()) {
    return
  }

  if (intensity === 'gentle') {
    confetti({ particleCount: 35, spread: 55, startVelocity: 32, origin: { y: 0.7 }, colors: COLORS })
    return
  }

  if (intensity === 'light') {
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 }, colors: COLORS })
    return
  }

  const duration = 1200
  const end = Date.now() + duration

  const frame = () => {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: COLORS })
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: COLORS })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: COLORS })
  frame()
}
