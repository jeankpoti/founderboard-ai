'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth as getAuth } from '@/lib/firebase/client'
import { signInSchema, type SignInInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof SignInInput, string>>>({})

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    // Validate with Zod
    const result = signInSchema.safeParse(data)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignInInput, string>> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignInInput
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      setIsLoading(false)
      return
    }

    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        getAuth(),
        result.data.email,
        result.data.password
      )

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

      toast.success('Signed in successfully!')
      router.push(redirectTo)
    } catch (error: unknown) {
      console.error('Login error:', error)

      // Handle Firebase Auth errors
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string }
        switch (firebaseError.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            toast.error('Invalid email or password')
            break
          case 'auth/too-many-requests':
            toast.error('Too many failed attempts. Please try again later.')
            break
          case 'auth/user-disabled':
            toast.error('This account has been disabled.')
            break
          default:
            toast.error('Failed to sign in. Please try again.')
        }
      } else {
        toast.error('Failed to sign in. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          required
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  )
}
