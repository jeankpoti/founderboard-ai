'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth as getAuth } from '@/lib/firebase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SignOutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  className?: string
}

export function SignOutButton({ variant = 'ghost', className }: SignOutButtonProps) {
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
      onClick={handleSignOut}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Signing out...' : 'Sign out'}
    </Button>
  )
}
