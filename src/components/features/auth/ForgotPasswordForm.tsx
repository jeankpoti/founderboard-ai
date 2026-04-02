'use client'

import { useState } from 'react'
import Link from 'next/link'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth as getAuth } from '@/lib/firebase/client'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ResetPasswordInput, string>>>({})

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      email: formData.get('email') as string,
    }

    // Validate with Zod
    const result = resetPasswordSchema.safeParse(data)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ResetPasswordInput, string>> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ResetPasswordInput
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      setIsLoading(false)
      return
    }

    try {
      await sendPasswordResetEmail(getAuth(), result.data.email)
      setIsSubmitted(true)
      toast.success('Password reset email sent!')
    } catch (error: unknown) {
      console.error('Password reset error:', error)

      // Handle Firebase Auth errors
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string }
        switch (firebaseError.code) {
          case 'auth/user-not-found':
            // Don't reveal if user exists for security
            setIsSubmitted(true)
            break
          case 'auth/too-many-requests':
            toast.error('Too many requests. Please try again later.')
            break
          case 'auth/invalid-email':
            setErrors({ email: 'Invalid email address' })
            break
          default:
            toast.error('Failed to send reset email. Please try again.')
        }
      } else {
        toast.error('Failed to send reset email. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold">Check your email</h3>
          <p className="text-sm text-muted-foreground mt-1">
            If an account exists with that email, we&apos;ve sent password reset instructions.
          </p>
        </div>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Back to login
          </Button>
        </Link>
      </div>
    )
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

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send reset link'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
