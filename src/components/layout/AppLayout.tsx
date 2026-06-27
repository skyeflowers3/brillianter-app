import { useCallback, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useLessonNavigation } from '../../hooks/useLessonNavigation'
import { useProgressContext } from '../../hooks/useProgressContext'
import { deleteAllLessonProgress } from '../../services/progressService'
import { deleteMasteryProfile } from '../../services/masteryProfileService'
import { resetUserProgressState } from '../../services/userService'
import { LeaveLessonDialog } from './LeaveLessonDialog'
import { AiTutorWidget } from '../tutor/AiTutorWidget'

export function AppLayout() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const { refreshProgress } = useProgressContext()
  const { requestDashboardNavigation } = useLessonNavigation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const onDashboard = pathname === '/dashboard'
  // The AI tutor is available while working through a lesson or a personalized review session, but
  // not on the dashboard or during a skill check (where outside help would defeat the assessment).
  const tutorEnabled = pathname.startsWith('/lesson/') || pathname.startsWith('/remediation/')

  const [confirmingReset, setConfirmingReset] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleConfirmReset = useCallback(async () => {
    if (!user || resetting) {
      return
    }

    setResetting(true)
    try {
      await deleteAllLessonProgress(user.uid)
      await deleteMasteryProfile(user.uid)
      await resetUserProgressState(user.uid)
      await Promise.all([refreshProgress(), refreshProfile()])
      setConfirmingReset(false)
      navigate('/dashboard')
    } catch (error) {
      console.warn('Failed to reset progress', error)
    } finally {
      setResetting(false)
    }
  }, [navigate, refreshProfile, refreshProgress, resetting, user])

  return (
    <div className="app-layout">
      <header className="app-header">
        <button
          type="button"
          className="app-header__brand"
          aria-label="Back to dashboard"
          onClick={requestDashboardNavigation}
        >
          <span className="app-header__logo">Brillianter</span>
          <span className="app-header__subtitle">Linear Algebra</span>
        </button>
        <div className="app-header__actions">
          {profile && <span className="app-header__user">Hi, {profile.name}</span>}
          {!onDashboard && (
            <button
              type="button"
              className="button button--primary"
              onClick={requestDashboardNavigation}
            >
              Dashboard
            </button>
          )}
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setConfirmingReset(true)}
          >
            Reset progress
          </button>
          <button type="button" className="button button--secondary" onClick={() => signOut()}>
            Log out
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <LeaveLessonDialog />
      {tutorEnabled && <AiTutorWidget />}

      {confirmingReset && (
        <div
          className="dialog-backdrop"
          role="presentation"
          onClick={() => !resetting && setConfirmingReset(false)}
        >
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-progress-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="reset-progress-title">Reset all progress?</h2>
            <p>
              This permanently erases every lesson and skill check, including your mastery and
              streak. You'll start over as if you just created your account. This can't be undone.
            </p>
            <div className="dialog__actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={() => setConfirmingReset(false)}
                disabled={resetting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={() => void handleConfirmReset()}
                disabled={resetting}
              >
                {resetting ? 'Resetting...' : 'Reset everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
