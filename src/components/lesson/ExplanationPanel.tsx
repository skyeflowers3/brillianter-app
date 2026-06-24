interface ExplanationPanelProps {
  explanation: string
}

export function ExplanationPanel({ explanation }: ExplanationPanelProps) {
  return (
    <div className="lesson-panel lesson-panel--explanation" role="note">
      <h3>Explanation</h3>
      <p>{explanation}</p>
    </div>
  )
}
