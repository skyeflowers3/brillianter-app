import type { Question, QuestionInteractionState } from '../../types/lesson'
import { DrawVectorQuestion } from './questions/DrawVectorQuestion'
import { FindMagnitudeQuestion } from './questions/FindMagnitudeQuestion'
import { ReadVectorQuestion } from './questions/ReadVectorQuestion'
import { HeadToTailConnectQuestion } from './questions/HeadToTailConnectQuestion'
import { HeadToTailDrawSumQuestion } from './questions/HeadToTailDrawSumQuestion'
import { HeadToTailFullQuestion } from './questions/HeadToTailFullQuestion'
import { HeadToTailFreeQuestion } from './questions/HeadToTailFreeQuestion'
import { LinearComboQuestion } from './questions/LinearComboQuestion'
import { ConstructComboQuestion } from './questions/ConstructComboQuestion'
import { MultipleChoiceQuestion } from './questions/MultipleChoiceQuestion'
import { NegateVectorQuestion } from './questions/NegateVectorQuestion'
import { ScalarMultiplyQuestion } from './questions/ScalarMultiplyQuestion'
import { VectorAdditionQuestion } from './questions/VectorAdditionQuestion'
import { VectorSubtractQuestion } from './questions/VectorSubtractQuestion'

interface QuestionRendererProps {
  question: Question
  state: QuestionInteractionState
  onStateChange: (state: QuestionInteractionState) => void
  disabled?: boolean
}

export function QuestionRenderer({
  question,
  state,
  onStateChange,
  disabled = false,
}: QuestionRendererProps) {
  if (question.type === 'drawVector' && state.type === 'drawVector') {
    return (
      <DrawVectorQuestion
        tip={state.tip}
        onTipChange={(tip) => onStateChange({ type: 'drawVector', tip })}
        disabled={disabled}
      />
    )
  }

  if (question.type === 'readVector' && state.type === 'readVector') {
    return (
      <ReadVectorQuestion
        question={question}
        state={state}
        onStateChange={onStateChange}
        disabled={disabled}
      />
    )
  }

  if (question.type === 'findMagnitude' && state.type === 'findMagnitude') {
    return (
      <FindMagnitudeQuestion
        question={question}
        state={state}
        onStateChange={onStateChange}
        disabled={disabled}
      />
    )
  }

  if (question.type === 'headToTailAdd' && state.type === 'headToTailAdd') {
    return (
      <VectorAdditionQuestion
        question={question}
        state={state}
        onStateChange={onStateChange}
        disabled={disabled}
      />
    )
  }

  if (question.type === 'scalarSlider' && state.type === 'scalarSlider') {
    return (
      <ScalarMultiplyQuestion
        question={question}
        state={state}
        onStateChange={onStateChange}
        disabled={disabled}
      />
    )
  }

  if (question.type === 'headToTailConnect' && state.type === 'headToTailConnect') {
    return (
      <HeadToTailConnectQuestion
        question={question}
        state={state}
        onStateChange={onStateChange}
        disabled={disabled}
      />
    )
  }

  if (question.type === 'headToTailDrawSum' && state.type === 'headToTailDrawSum') {
    return (
      <HeadToTailDrawSumQuestion
        question={question}
        state={state}
        onStateChange={onStateChange}
        disabled={disabled}
      />
    )
  }

  if (question.type === 'headToTailFull' && state.type === 'headToTailFull') {
    return (
      <HeadToTailFullQuestion
        question={question}
        state={state}
        onStateChange={onStateChange}
        disabled={disabled}
      />
    )
  }

  if (question.type === 'headToTailFree' && state.type === 'headToTailFree') {
    return (
      <HeadToTailFreeQuestion
        question={question}
        state={state}
        onStateChange={onStateChange}
        disabled={disabled}
      />
    )
  }

  if (question.type === 'multipleChoice' && state.type === 'multipleChoice') {
    return (
      <MultipleChoiceQuestion
        question={question}
        state={state}
        onStateChange={onStateChange}
        disabled={disabled}
      />
    )
  }

  if (question.type === 'negateVector' && state.type === 'negateVector') {
    return (
      <NegateVectorQuestion
        question={question}
        state={state}
        onStateChange={onStateChange}
        disabled={disabled}
      />
    )
  }

  if (question.type === 'vectorSubtract' && state.type === 'vectorSubtract') {
    return (
      <VectorSubtractQuestion
        question={question}
        state={state}
        onStateChange={onStateChange}
        disabled={disabled}
      />
    )
  }

  if (question.type === 'linearCombo' && state.type === 'linearCombo') {
    return (
      <LinearComboQuestion
        question={question}
        state={state}
        onStateChange={onStateChange}
        disabled={disabled}
      />
    )
  }

  if (question.type === 'constructCombo' && state.type === 'constructCombo') {
    return (
      <ConstructComboQuestion
        question={question}
        state={state}
        onStateChange={onStateChange}
        disabled={disabled}
      />
    )
  }

  return null
}
