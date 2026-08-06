/**
 * Dev Insights Page
 *
 * Displays development metrics from GitHub and Linear integrations.
 */

import { Suspense } from 'react'
import { DevInsightsDashboard } from '@/components/features/dev-insights'
import { Spinner } from '@/components/ui/spinner'

export const metadata = {
  title: 'Dev Insights | Founderboard',
  description: 'Track development activity from GitHub and Linear',
}

export default async function DevInsightsPage() {
  // Authentication handled by layout - supports guest mode with mock data
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Dev Insights</h1>
        <p className="text-muted-foreground">
          Track commits, pull requests, and issues from GitHub and Linear
        </p>
      </div>

      {/* Dashboard */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        }
      >
        <DevInsightsDashboard />
      </Suspense>
    </div>
  )
}
