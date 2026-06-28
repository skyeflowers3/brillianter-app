import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { PretestQuestion } from '../../types/pretest'
import { PretestPanel } from './PretestPanel'
import lesson1Pretest from '../../content/questions/lesson-1-pretest.json'
import lesson2Pretest from '../../content/questions/lesson-2-pretest.json'
import lesson4Pretest from '../../content/questions/lesson-4-pretest.json'

// Guard the "no Firestore writes" promise: PretestPanel must never reach the database. These spies
// stay at zero because nothing in its tree imports firestore; the assertion fails loudly if that
// ever changes.
const firestoreWrites = vi.hoisted(() => ({
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
}))

vi.mock('firebase/firestore', () => firestoreWrites)

const l1 = lesson1Pretest as unknown as PretestQuestion
const l2 = lesson2Pretest as unknown as PretestQuestion
const l4 = lesson4Pretest as unknown as PretestQuestion

const INTRO = "Before we dive in, give this a try. You're not expected to know it yet."

function enterVector(name: string, x: string, y: string) {
  fireEvent.change(screen.getByLabelText(`${name} x component`), { target: { value: x } })
  fireEvent.change(screen.getByLabelText(`${name} y component`), { target: { value: y } })
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('PretestPanel', () => {
  it('shows the intro line and prompt, with submit disabled until a committed attempt', () => {
    render(<PretestPanel pretest={l1} onContinue={() => {}} />)

    expect(screen.getByText(INTRO)).toBeInTheDocument()
    expect(
      screen.getByText("Draw the vector (4, 3). Best guess; you're not expected to know this yet."),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lock in my guess' })).toBeDisabled()
  })

  it('keeps submit disabled until the graded field holds an attempt (vectorSubtract)', () => {
    render(<PretestPanel pretest={l4} onContinue={() => {}} />)

    const submit = screen.getByRole('button', { name: 'Lock in my guess' })
    expect(submit).toBeDisabled()

    enterVector('A − B', '3', '1')
    expect(submit).toBeEnabled()
  })

  it('reveals both the grid arrow and the numeric label after locking in', () => {
    const { container } = render(<PretestPanel pretest={l2} onContinue={() => {}} />)

    enterVector('a + b', '4', '3')
    fireEvent.click(screen.getByRole('button', { name: 'Lock in my guess' }))

    // The reveal draws two arrows (the guess and the answer) on one plane...
    expect(screen.getByRole('img', { name: /coordinate plane/i })).toBeInTheDocument()
    expect(container.querySelectorAll('.vector__shaft')).toHaveLength(2)
    // ...and labels the correct vector with its numeric value.
    expect(screen.getByText('(4, 3)')).toBeInTheDocument()
  })

  it('affirms a correct guess (within grading tolerance)', () => {
    render(<PretestPanel pretest={l2} onContinue={() => {}} />)

    enterVector('a + b', '4', '3') // exact answer, within tolerance 0.5
    fireEvent.click(screen.getByRole('button', { name: 'Lock in my guess' }))

    expect(screen.getByText("That's correct, a + b = (4, 3)! Let's see why.")).toBeInTheDocument()
    expect(screen.queryByText(/nice, you were close/i)).not.toBeInTheDocument()
  })

  it('shows warm "close" copy within closeThreshold but outside tolerance', () => {
    render(<PretestPanel pretest={l2} onContinue={() => {}} />)

    enterVector('a + b', '4', '4') // distance 1.0 from (4, 3): outside tolerance 0.5, inside band 1.5
    fireEvent.click(screen.getByRole('button', { name: 'Lock in my guess' }))

    expect(screen.getByText('Nice, you were close! a + b = (4, 3).')).toBeInTheDocument()
    expect(screen.queryByText(/that's correct/i)).not.toBeInTheDocument()
  })

  it('shows neutral default copy when the guess is outside closeThreshold', () => {
    render(<PretestPanel pretest={l2} onContinue={() => {}} />)

    enterVector('a + b', '0', '4') // distance ~4.12 from (4, 3), beyond closeThreshold 1.5
    fireEvent.click(screen.getByRole('button', { name: 'Lock in my guess' }))

    expect(
      screen.getByText(
        "Here's the answer: a + b = (4, 3). You'll see exactly how to add them in this lesson.",
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/nice, you were close/i)).not.toBeInTheDocument()
  })

  it('renders no punitive scoring text in the reveal', () => {
    render(<PretestPanel pretest={l2} onContinue={() => {}} />)

    enterVector('a + b', '4', '4') // a close miss: copy stays warm, never punitive
    fireEvent.click(screen.getByRole('button', { name: 'Lock in my guess' }))

    expect(screen.queryByText(/incorrect/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/not quite/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/wrong/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/score/i)).not.toBeInTheDocument()
    // The flag-style incorrect-message helpers from validation.ts produce phrases like
    // "Check the direction" / "Try again"; none should appear.
    expect(screen.queryByText(/try again/i)).not.toBeInTheDocument()
  })

  it('advances into the lesson via Continue', () => {
    const onContinue = vi.fn()
    render(<PretestPanel pretest={l2} onContinue={onContinue} />)

    enterVector('a + b', '4', '3')
    fireEvent.click(screen.getByRole('button', { name: 'Lock in my guess' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('never writes to Firestore across the full attempt and reveal flow', () => {
    const onContinue = vi.fn()
    render(<PretestPanel pretest={l2} onContinue={onContinue} />)

    enterVector('a + b', '4', '3')
    fireEvent.click(screen.getByRole('button', { name: 'Lock in my guess' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(firestoreWrites.setDoc).not.toHaveBeenCalled()
    expect(firestoreWrites.updateDoc).not.toHaveBeenCalled()
    expect(firestoreWrites.addDoc).not.toHaveBeenCalled()
    expect(firestoreWrites.deleteDoc).not.toHaveBeenCalled()
  })
})
