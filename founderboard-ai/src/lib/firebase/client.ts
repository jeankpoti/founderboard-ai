import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase only once and only on client side
let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined

function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase client SDK can only be used in the browser')
  }

  if (!app) {
    if (!firebaseConfig.apiKey) {
      throw new Error('Firebase API key is not configured. Please set NEXT_PUBLIC_FIREBASE_API_KEY in your environment.')
    }
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  }

  return app
}

function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
  }
  return auth
}

function getFirebaseDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp())
  }
  return db
}

// Export getters instead of direct instances to avoid initialization during build
export { getFirebaseAuth as auth, getFirebaseDb as db }

// For backwards compatibility, also export a function to get the instances
export function getFirebaseServices() {
  return {
    app: getFirebaseApp(),
    auth: getFirebaseAuth(),
    db: getFirebaseDb(),
  }
}
