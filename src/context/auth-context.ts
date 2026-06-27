import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { UserProfile } from '../types/user'

export interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  createAccountWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** Re-fetches the signed-in user's profile (e.g. after a streak update). */
  refreshProfile: () => Promise<void>
  /**
   * True only between an auth arrival (sign-in or a session restored on app load) and the first time
   * the dashboard evaluates it. Used to gate the daily-review redirect to a fresh login, so mid-
   * session visits to the dashboard never trigger it.
   */
  freshLogin: boolean
  /** Marks the fresh-login signal as spent for this session. */
  consumeFreshLogin: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
