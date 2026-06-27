import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/routing/ProtectedRoute'
import { PublicRoute } from './components/routing/PublicRoute'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import './styles/app.css'
import './styles/responsive.css'

// Heavier authenticated routes are split into their own chunks so they load on demand. The pages
// use named exports, so map them to the default export shape that React.lazy expects.
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const LessonPage = lazy(() =>
  import('./pages/LessonPage').then((m) => ({ default: m.LessonPage })),
)
const SkillCheckPage = lazy(() =>
  import('./pages/SkillCheckPage').then((m) => ({ default: m.SkillCheckPage })),
)
const RemediationPage = lazy(() =>
  import('./pages/RemediationPage').then((m) => ({ default: m.RemediationPage })),
)
const DailyReviewPage = lazy(() =>
  import('./pages/DailyReviewPage').then((m) => ({ default: m.DailyReviewPage })),
)
// The authenticated shell (progress/tutor providers + chrome) is split out so the Firestore SDK it
// depends on isn't part of the initial login bundle.
const ProtectedAppShell = lazy(() =>
  import('./components/routing/ProtectedAppShell').then((m) => ({ default: m.ProtectedAppShell })),
)

function RouteFallback() {
  return (
    <div className="page-center">
      <p className="muted">Loading...</p>
    </div>
  )
}

function RootRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="page-center">
        <p className="muted">Loading...</p>
      </div>
    )
  }

  return <Navigate to={user ? '/dashboard' : '/login'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<Navigate to="/login" replace />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<ProtectedAppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/lesson/:lessonId" element={<LessonPage />} />
                <Route path="/skill-check/:lessonId" element={<SkillCheckPage />} />
                <Route path="/remediation/:lessonId" element={<RemediationPage />} />
                <Route path="/daily-review" element={<DailyReviewPage />} />
              </Route>
            </Route>

            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
