import { ProgressProvider } from '../../context/ProgressContext'
import { LessonNavigationProvider } from '../../context/LessonNavigationContext'
import { TutorProvider } from '../../context/TutorContext'
import { AppLayout } from '../layout/AppLayout'

/**
 * The authenticated app shell: the progress/navigation/tutor providers plus the chrome that wrap
 * every protected route. Kept in its own module so it can be lazily loaded — this is what keeps the
 * Firestore-backed providers (and the Firestore SDK chunk) out of the initial/login bundle.
 */
export function ProtectedAppShell() {
  return (
    <ProgressProvider>
      <LessonNavigationProvider>
        <TutorProvider>
          <AppLayout />
        </TutorProvider>
      </LessonNavigationProvider>
    </ProgressProvider>
  )
}
