import { useLessonNavigation } from '../../hooks/useLessonNavigation'

export function LeaveLessonDialog() {
  const { isLeaveDialogOpen, confirmLeaveLesson, cancelLeaveLesson } = useLessonNavigation()

  if (!isLeaveDialogOpen) {
    return null
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={cancelLeaveLesson}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-lesson-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="leave-lesson-title">Leave lesson?</h2>
        <p>Your progress is saved. You can continue where you left off from the dashboard.</p>
        <div className="dialog__actions">
          <button type="button" className="button button--primary" onClick={cancelLeaveLesson}>
            Stay
          </button>
          <button type="button" className="button button--secondary" onClick={confirmLeaveLesson}>
            Leave
          </button>
        </div>
      </div>
    </div>
  )
}
