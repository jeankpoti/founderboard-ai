import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

let app: App | undefined
let adminAuth: Auth | undefined
let adminDb: Firestore | undefined

function normalizeStorageBucketName(bucket: string | undefined): string | undefined {
  if (!bucket) {
    return undefined
  }

  return bucket
    .replace(/^gs:\/\//, '')
    .replace(/\/+$/, '')
    .trim()
}

function getAdminStorageBucketName(): string | undefined {
  return normalizeStorageBucketName(
    process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  )
}

function getAdminApp(): App {
  if (!app) {
    const apps = getApps()

    if (apps.length > 0) {
      app = apps[0]
    } else {
      const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
      const storageBucket = getAdminStorageBucketName()

      if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
          'Firebase Admin credentials not configured. ' +
          'Please set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.'
        )
      }

      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket,
      })
    }
  }

  return app
}

function getAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(getAdminApp())
  }
  return adminAuth
}

function getAdminDb(): Firestore {
  if (!adminDb) {
    adminDb = getFirestore(getAdminApp())
  }
  return adminDb
}

// Export getters to avoid initialization during build
export {
  getAdminAuth as adminAuth,
  getAdminDb as adminDb,
  getAdminApp as getFirebaseAdminApp,
  getAdminStorageBucketName,
}
