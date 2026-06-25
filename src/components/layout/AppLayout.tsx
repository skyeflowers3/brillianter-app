import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useLessonNavigation } from '../../hooks/useLessonNavigation'
import { LeaveLessonDialog } from './LeaveLessonDialog'

export function AppLayout() {
  const { profile, signOut } = useAuth()
  const { requestDashboardNavigation } = useLessonNavigation()
  const { pathname } = useLocation()
  const onDashboard = pathname === '/dashboard'

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
          <button type="button" className="button button--secondary" onClick={() => signOut()}>
            Log out
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <LeaveLessonDialog />
    </div>
  )
}
