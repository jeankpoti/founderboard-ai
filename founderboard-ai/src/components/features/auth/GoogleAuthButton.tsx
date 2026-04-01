'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth as getAuth } from '@/lib/firebase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface GoogleAuthButtonProps {
  mode: 'signup' | 'signin'
}

export function GoogleAuthButton({ mode }: GoogleAuthButtonProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const [isLoading, setIsLoading] = useState(false)

  async function handleGoogleAuth() {
    setIsLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account',
      })

      const result = await signInWithPopup(getAuth(), provider)

      // Get ID token for session creation
      const idToken = await result.user.getIdToken()

      // Create session cookie via API
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      const sessionResult = await response.json()

      if (!sessionResult.success) {
        throw new Error(sessionResult.error?.message || 'Failed to create session')
      }

      toast.success(mode === 'signup' ? 'Account created successfully!' : 'Signed in successfully!')
      router.push(redirectTo)
    } catch (error: unknown) {
      console.error('Google auth error:', error)

      // Handle specific Firebase errors
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string }
        switch (firebaseError.code) {
          case 'auth/popup-closed-by-user':
            // User closed the popup, no error needed
            break
          case 'auth/cancelled-popup-request':
            // Another popup was opened, no error needed
            break
          case 'auth/popup-blocked':
            toast.error('Popup was blocked. Please allow popups for this site.')
            break
          case 'auth/account-exists-with-different-credential':
            toast.error('An account already exists with this email using a different sign-in method.')
            break
          default:
            toast.error('Failed to sign in with Google. Please try again.')
        }
      } else if (error instanceof Error && error.message !== 'Failed to create session') {
        toast.error('Failed to sign in with Google. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleGoogleAuth}
      disabled={isLoading}
    >
      {isLoading ? (
        'Connecting...'
      ) : (
        <>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </>
      )}
    </Button>
  )
}
