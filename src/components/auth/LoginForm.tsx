import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { GoogleIcon } from './GoogleIcon'

export function LoginForm() {
  const { signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleGoogleSignIn() {
    setError(null)
    setSubmitting(true)

    try {
      await signInWithGoogle()
      navigate('/dashboard', { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Sign in failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-card">
      <h1>Welcome to Brillianter</h1>
      <p className="auth-card__subtitle">
        Sign in with Google to start learning linear algebra through interaction.
      </p>

      <button
        type="button"
        className="google-button"
        onClick={() => void handleGoogleSignIn()}
        disabled={submitting}
      >
        <GoogleIcon />
        <span>{submitting ? 'Signing in...' : 'Continue with Google'}</span>
      </button>

      {error && <p className="form-error">{error}</p>}

      <p className="auth-card__footer">
        New here? Signing in with Google creates your account automatically.
      </p>
    </div>
  )
}
