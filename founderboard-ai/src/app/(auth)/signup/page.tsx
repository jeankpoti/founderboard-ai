import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SignupForm, GoogleAuthButton } from '@/components/features/auth'
import { Skeleton } from '@/components/ui/skeleton'

function SignupFormFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function SignupPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
        <CardDescription>Get started with FounderBoard AI</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Suspense fallback={<Skeleton className="h-10 w-full" />}>
          <GoogleAuthButton mode="signup" />
        </Suspense>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Suspense fallback={<SignupFormFallback />}>
          <SignupForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
