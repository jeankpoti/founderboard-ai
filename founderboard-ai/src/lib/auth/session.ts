import { cookies } from 'next/headers'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { SESSION_COOKIE_NAME } from '@/lib/constants'
import type { UserProfile } from '@/types/user'

export interface SessionUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  linkedOrgIds: string[]
}

export interface SessionResult {
  user: SessionUser | null
  error: string | null
}

/**
 * Verifies the session cookie and returns the user data.
 * This should be called from Server Components or Server Actions.
 */
export async function verifySession(): Promise<SessionResult> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionCookie) {
    return { user: null, error: 'No session cookie found' }
  }

  try {
    // Verify the session cookie with Firebase Admin
    const decodedClaims = await adminAuth().verifySessionCookie(sessionCookie, true)

    // Get user document from Firestore
    const userDoc = await adminDb()
      .collection(COLLECTIONS.USERS)
      .doc(decodedClaims.uid)
      .get()

    if (!userDoc.exists) {
      return { user: null, error: 'User not found' }
    }

    const userData = userDoc.data() as UserProfile

    return {
      user: {
        uid: decodedClaims.uid,
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        linkedOrgIds: userData.linkedOrgIds || [],
      },
      error: null,
    }
  } catch (error) {
    console.error('Session verification error:', error)
    return { user: null, error: 'Session invalid or expired' }
  }
}


/**
 * Gets the current user from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const { user } = await verifySession()
  return user
}

/**
 * Requires authentication - throws redirect if not authenticated.
 * Use this in Server Components that require auth.
 */
export async function requireAuth(): Promise<SessionUser> {
  const { user, error } = await verifySession()

  if (!user) {
    // This will be caught by error boundary or handled by caller
    throw new Error(error || 'Authentication required')
  }

  return user
}
