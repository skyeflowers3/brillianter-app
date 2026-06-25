import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyBAFN0p0alhkbRcOiyz6uoqw85T3TClVUE',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'brillianter-app.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'brillianter-app',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
    'brillianter-app.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '736744749029',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ??
    '1:736744749029:web:f1244044c1d9b0edf1210c',
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-5GKV9Y2VX3',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

export default app
