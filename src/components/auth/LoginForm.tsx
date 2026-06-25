import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { GoogleIcon } from './GoogleIcon'

type PendingAction = 'google' | 'signin' | 'create' | null

export function LoginForm() {
  const { signInWithGoogle, signInWithEmail, createAccountWithEmail } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingAction>(null)

  const submitting = pending !== null

  async function runAction(action: Exclude<PendingAction, null>, run: () => Promise<void>) {
    setError(null)
    setPending(action)

    try {
      await run()
      navigate('/dashboard', { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Sign in failed.')
    } finally {
      setPending(null)
    }
  }

  function handleGoogleSignIn() {
    void runAction('google', () => signInWithGoogle())
  }

  function handleEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    void runAction('signin', () => signInWithEmail(email.trim(), password))
  }

  function handleCreateAccount() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    void runAction('create', () => createAccountWithEmail(email.trim(), password))
  }

  return (
    <div className="auth-card">
      <h1>Welcome to Brillianter</h1>
      <p className="auth-card__subtitle">
        Sign in to start learning linear algebra through interaction.
      </p>

      <form className="auth-form" onSubmit={handleEmailSignIn}>
        <label className="field">
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
            required
          />
        </label>

        <label className="field">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
            required
          />
        </label>

        <button type="submit" className="button button--primary" disabled={submitting}>
          {pending === 'signin' ? 'Signing in...' : 'Sign in with email'}
        </button>

        <button
          type="button"
          className="button button--secondary"
          onClick={handleCreateAccount}
          disabled={submitting}
        >
          {pending === 'create' ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="auth-divider" aria-hidden="true">
        <span>or</span>
      </div>

      <button
        type="button"
        className="google-button"
        onClick={handleGoogleSignIn}
        disabled={submitting}
      >
        <GoogleIcon />
        <span>{pending === 'google' ? 'Signing in...' : 'Continue with Google'}</span>
      </button>

      {error && <p className="form-error">{error}</p>}

      <p className="auth-card__footer">
        New here? Use “Create account”, or continue with Google to set up an account automatically.
      </p>
    </div>
  )
}
