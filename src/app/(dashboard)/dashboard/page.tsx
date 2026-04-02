import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { Dashboard } from '@/components/features/dashboard'

export default async function DashboardPage() {
  const orgContext = await getOrgContext()

  if (!orgContext) {
    // Either not logged in or no org - let layout handle redirect
    redirect('/onboarding')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Track your key metrics and business health
        </p>
      </div>

      <Dashboard role={orgContext.role} />
    </div>
  )
}
