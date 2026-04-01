import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateOrgForm } from '@/components/features/onboarding'

export default async function OnboardingPage() {
  const { user } = await verifySession()

  if (!user) {
    redirect('/login')
  }

  // If user already has organizations, redirect to dashboard
  if (user.linkedOrgIds && user.linkedOrgIds.length > 0) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">Welcome to FounderBoard AI</CardTitle>
          <CardDescription>
            Let&apos;s get started by creating your first organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrgForm />
        </CardContent>
      </Card>
    </div>
  )
}
