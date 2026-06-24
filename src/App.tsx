import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProgressProvider } from './context/ProgressContext'
import { LessonNavigationProvider } from './context/LessonNavigationContext'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/routing/ProtectedRoute'
import { PublicRoute } from './components/routing/PublicRoute'
import { useAuth } from './hooks/useAuth'
import { DashboardPage } from './pages/DashboardPage'
import { LessonPage } from './pages/LessonPage'
import { SkillCheckPage } from './pages/SkillCheckPage'
import { LoginPage } from './pages/LoginPage'
import './styles/app.css'
import './styles/responsive.css'

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
      </BrowserRouter>
    </AuthProvider>
  )
}
