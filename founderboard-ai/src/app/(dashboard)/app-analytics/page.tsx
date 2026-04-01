/**
 * App Analytics Page
 *
 * Displays combined analytics from App Store Connect and Google Play.
 * Shows downloads, revenue, ratings, and reviews for mobile apps.
 */

import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { AppAnalyticsDashboard } from '@/components/features/app-analytics'

export const metadata = {
  title: 'App Analytics | Founderboard',
  description: 'Track your mobile app performance across iOS and Android',
}

export default async function AppAnalyticsPage() {
  const orgContext = await getOrgContext()

  if (!orgContext) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">App Analytics</h1>
        <p className="text-muted-foreground">
          Track downloads, revenue, ratings, and reviews for your mobile apps.
        </p>
      </div>

      <AppAnalyticsDashboard />
    </div>
  )
}
