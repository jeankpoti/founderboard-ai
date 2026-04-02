import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { SESSION_COOKIE_NAME, SESSION_EXPIRY_DAYS } from '@/lib/constants'
import { cookies } from 'next/headers'

// Create a session cookie from Firebase ID token
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REQUEST', message: 'ID token is required' } },
        { status: 400 }
      )
    }

    // Verify the ID token
    const decodedToken = await adminAuth().verifyIdToken(idToken)

    // Create session cookie (expires in 5 days)
    const expiresIn = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn })

    // Check if user document exists, if not create it
    const userRef = adminDb().collection(COLLECTIONS.USERS).doc(decodedToken.uid)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      // Create user document for new users
      await userRef.set({
        uid: decodedToken.uid,
        email: decodedToken.email || null,
        displayName: decodedToken.name || null,
        photoURL: decodedToken.picture || null,
        linkedOrgIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Set the session cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.json({ success: true, data: { uid: decodedToken.uid } })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SESSION_ERROR', message: 'Failed to create session' } },
      { status: 401 }
    )
  }
}

// Delete session cookie (logout)
export async function DELETE() {
  const cookieStore = await cookies()
  try {
    cookieStore.delete(SESSION_COOKIE_NAME)

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    console.error('Session deletion error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'SESSION_ERROR', message: 'Failed to delete session' } },
      { status: 500 }
    )
  }
}

// Verify session and return user data
export async function GET() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionCookie) {
    return NextResponse.json(
      { success: false, error: { code: 'NO_SESSION', message: 'No session found' } },
      { status: 401 }
    )
  }

  try {
    // Verify the session cookie
    const decodedClaims = await adminAuth().verifySessionCookie(sessionCookie, true)

    // Get user document
    const userDoc = await adminDb().collection(COLLECTIONS.USERS).doc(decodedClaims.uid).get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: { uid: decodedClaims.uid, ...userDoc.data() } })
  } catch (error) {
    console.error('Session verification error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_SESSION', message: 'Session is invalid or expired' } },
      { status: 401 }
    )
  }
}
