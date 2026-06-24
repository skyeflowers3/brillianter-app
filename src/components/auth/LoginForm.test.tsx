import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LoginForm } from './LoginForm'

const signInWithGoogle = vi.fn()

// useAuth requires an AuthProvider in real use; mock the hook so the form can render alone.
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ signInWithGoogle }),
}))

function renderLoginForm() {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  )
}

describe('LoginForm', () => {
  it('renders the Continue with Google button', () => {
    renderLoginForm()
    expect(
      screen.getByRole('button', { name: /continue with google/i }),
    ).toBeInTheDocument()
  })

  it('calls signInWithGoogle when the button is clicked', async () => {
    const user = userEvent.setup()
    signInWithGoogle.mockResolvedValue(undefined)
    renderLoginForm()

    await user.click(screen.getByRole('button', { name: /continue with google/i }))
    expect(signInWithGoogle).toHaveBeenCalledTimes(1)
  })
})
