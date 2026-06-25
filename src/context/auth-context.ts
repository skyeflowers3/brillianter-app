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
}

export const AuthContext = createContext<AuthContextValue | null>(null)
