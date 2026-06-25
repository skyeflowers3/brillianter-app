import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProgressProvider } from './context/ProgressContext'
import { LessonNavigationProvider } from './context/LessonNavigationContext'
import { AppLayout } from './components/layout/AppLayout'
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

function ProtectedAppShell() {
  return (
    <ProgressProvider>
      <LessonNavigationProvider>
        <AppLayout />
      </LessonNavigationProvider>
    </ProgressProvider>
  )
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
