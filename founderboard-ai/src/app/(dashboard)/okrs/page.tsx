/**
 * OKRs Page
 *
 * Main page for the OKRs (Objectives and Key Results) feature.
 * Displays objectives with their key results and progress tracking.
 */

import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { OKRDashboard } from '@/components/features/okrs'

export const metadata = {
  title: 'OKRs | Founderboard',
  description: 'Track your objectives and key results',
}

export default async function OKRsPage() {
  const orgContext = await getOrgContext()

  if (!orgContext) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">OKRs</h1>
        <p className="text-muted-foreground">
          Set objectives and track progress with measurable key results.
        </p>
      </div>

      <OKRDashboard />
    </div>
  )
}
