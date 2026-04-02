'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth as getAuth } from '@/lib/firebase/client'
import { signUpSchema, type SignUpInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function SignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpInput, string>>>({})

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      displayName: formData.get('displayName') as string || undefined,
    }

    // Validate with Zod
    const result = signUpSchema.safeParse(data)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignUpInput, string>> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignUpInput
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      setIsLoading(false)
      return
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        getAuth(),
        result.data.email,
        result.data.password
      )

      // Update display name if provided
      if (result.data.displayName) {
        await updateProfile(userCredential.user, {
          displayName: result.data.displayName,
        })
      }

      // Get ID token for session creation
      const idToken = await userCredential.user.getIdToken()

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

      toast.success('Account created successfully!')
      router.push('/dashboard')
    } catch (error: unknown) {
      console.error('Signup error:', error)

      // Handle Firebase Auth errors
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string }
        switch (firebaseError.code) {
          case 'auth/email-already-in-use':
            setErrors({ email: 'Email already in use' })
            break
          case 'auth/invalid-email':
            setErrors({ email: 'Invalid email address' })
            break
          case 'auth/weak-password':
            setErrors({ password: 'Password is too weak' })
            break
          default:
            toast.error('Failed to create account. Please try again.')
        }
      } else {
        toast.error('Failed to create account. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="displayName">Name (optional)</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          placeholder="Your name"
          disabled={isLoading}
        />
        {errors.displayName && (
          <p className="text-sm text-destructive">{errors.displayName}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Min. 8 characters"
          required
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Must contain uppercase, lowercase, and a number
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
