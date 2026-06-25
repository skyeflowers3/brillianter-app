import { useCallback } from 'react'
import { CoordinatePlane } from '../../svg/CoordinatePlane'
import { Vector } from '../../svg/Vector'
import type { Vec2 } from '../../../lib/vectorMath'
import type {
  ReadVectorQuestion as ReadVectorQuestionType,
  ReadVectorState,
} from '../../../types/lesson'
import { VectorComponentInput } from './VectorComponentInput'

const PLANE_MIN = -6
const PLANE_MAX = 6

interface ReadVectorQuestionProps {
  question: ReadVectorQuestionType
  state: ReadVectorState
  onStateChange: (next: ReadVectorState) => void
  disabled?: boolean
}

export function ReadVectorQuestion({
  question,
  state,
  onStateChange,
  disabled = false,
}: ReadVectorQuestionProps) {
  const displayVector = question.correctAnswer.vector

  const handleInput = useCallback(
    (vectorInput: Vec2) => {
      onStateChange({ type: 'readVector', vectorInput })
    },
    [onStateChange],
  )

  return (
    <div className="read-vector-question">
      <CoordinatePlane min={PLANE_MIN} max={PLANE_MAX}>
        {/* No label — the learner has to read the components themselves. */}
        <Vector tip={displayVector} color="var(--lesson-vector-a)" />
      </CoordinatePlane>

      <div className="read-vector-question__answer">
        <span className="read-vector-question__label">This vector is</span>
        <VectorComponentInput
          name="shown vector"
          value={state.vectorInput}
          onChange={handleInput}
          disabled={disabled}
          color="var(--lesson-vector-a)"
        />
      </div>

      {!disabled && (
        <p className="read-vector-question__help muted">
          Read the vector from the graph: count how far it moves right or left (first number) and up
          or down (second number).
        </p>
      )}
    </div>
  )
}
