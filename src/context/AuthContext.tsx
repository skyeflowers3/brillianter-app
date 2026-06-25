import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../firebase'
import {
  createAccountWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
} from '../services/authService'
import { ensureUserDocument, getUserProfile } from '../services/userService'
import type { UserProfile } from '../types/user'
import { AuthContext } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)

      if (nextUser) {
        const nextProfile = await ensureUserDocument(nextUser.uid, {
          name: nextUser.displayName ?? nextUser.email ?? 'Learner',
          email: nextUser.email ?? '',
        })
        setProfile(nextProfile)
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const handleSignInWithGoogle = useCallback(async () => {
    await signInWithGoogle()
  }, [])

  const handleSignInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmail(email, password)
  }, [])

  const handleCreateAccountWithEmail = useCallback(async (email: string, password: string) => {
    await createAccountWithEmail(email, password)
  }, [])

  const handleSignOut = useCallback(async () => {
    await signOut()
  }, [])

  const handleRefreshProfile = useCallback(async () => {
    if (!user) {
      return
    }

    const nextProfile = await getUserProfile(user.uid)
    if (nextProfile) {
      setProfile(nextProfile)
    }
  }, [user])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signInWithGoogle: handleSignInWithGoogle,
      signInWithEmail: handleSignInWithEmail,
      createAccountWithEmail: handleCreateAccountWithEmail,
      signOut: handleSignOut,
      refreshProfile: handleRefreshProfile,
    }),
    [
      user,
      profile,
      loading,
      handleSignInWithGoogle,
      handleSignInWithEmail,
      handleCreateAccountWithEmail,
      handleSignOut,
      handleRefreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
