interface HintPanelProps {
  hint: string
}

export function HintPanel({ hint }: HintPanelProps) {
  return (
    <div className="lesson-panel lesson-panel--hint" role="note">
      <h3>Hint</h3>
      <p>{hint}</p>
    </div>
  )
}
