import { getFirestore } from 'firebase/firestore'
import app from './firebase'

// Firestore lives in its own module (separate from `auth`) so it stays OUT of the initial/login
// bundle. The Firestore SDK is the largest dependency; it is only pulled in when an authenticated
// session actually needs data — via the dynamic import in AuthContext, or a lazily-loaded route /
// the protected app shell. Keeping `getFirestore` out of `firebase.ts` is what lets the login page
// load without the Firestore chunk.
export const db = getFirestore(app)
