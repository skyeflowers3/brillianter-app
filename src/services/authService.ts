import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '../firebase'

const googleProvider = new GoogleAuthProvider()

function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Please allow popups and try again.'
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with a different sign-in method.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

function toAuthError(error: unknown): Error {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return new Error(getAuthErrorMessage(error.code))
  }

  return new Error('Something went wrong. Please try again.')
}

export async function signInWithGoogle(): Promise<User> {
  try {
    const credential = await signInWithPopup(auth, googleProvider)
    return credential.user
  } catch (error) {
    throw toAuthError(error)
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}
