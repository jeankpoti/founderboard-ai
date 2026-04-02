'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth as getAuth } from '@/lib/firebase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SignOutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  title?: string
}

export function SignOutButton({ variant = 'ghost', size, className, title }: SignOutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSignOut() {
    setIsLoading(true)

    try {
      // Sign out from Firebase client
      await signOut(getAuth())

      // Clear session cookie via API
      const response = await fetch('/api/auth/session', {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        console.error('Failed to clear session:', result.error)
      }

      toast.success('Signed out successfully')
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSignOut}
      disabled={isLoading}
      className={className}
      title={title}
    >
      {size === 'icon' ? (
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      ) : (
        isLoading ? 'Signing out...' : 'Sign out'
      )}
    </Button>
  )
}
