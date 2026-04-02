/**
 * Revenue Page
 *
 * Displays Stripe payment data including MRR, revenue trends,
 * subscriptions, and recent charges.
 */

import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { RevenueDashboard } from '@/components/features/revenue'

export const metadata = {
  title: 'Revenue | Founderboard',
  description: 'Track your Stripe revenue, MRR, and subscriptions',
}

export default async function RevenuePage() {
  const orgContext = await getOrgContext()

  if (!orgContext) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
        <p className="text-muted-foreground">
          Track your MRR, revenue trends, and payment activity.
        </p>
      </div>

      <RevenueDashboard />
    </div>
  )
}
