/**
 * Fundraising Page
 *
 * Main page for the Fundraising feature.
 * Displays fundraising rounds, term sheets, and progress tracking.
 */

import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { FundraisingDashboard } from '@/components/features/fundraising'

export const metadata = {
  title: 'Fundraising | Founderboard',
  description: 'Track your fundraising rounds, term sheets, and investor commitments',
}

export default async function FundraisingPage() {
  const orgContext = await getOrgContext()

  if (!orgContext) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fundraising</h1>
        <p className="text-muted-foreground">
          Track your fundraising rounds, term sheets, and investor progress.
        </p>
      </div>

      <FundraisingDashboard />
    </div>
  )
}
