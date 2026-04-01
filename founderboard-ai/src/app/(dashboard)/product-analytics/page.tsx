/**
 * Product Analytics Page
 *
 * Displays PostHog product analytics: events, funnels, retention.
 */

import { Suspense } from 'react'
import { verifySession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { ProductAnalyticsDashboard } from '@/components/features/product-analytics'
import { Spinner } from '@/components/ui/spinner'

export const metadata = {
  title: 'Product Analytics | Founderboard',
  description: 'Track user events, funnels, and retention from PostHog',
}

export default async function ProductAnalyticsPage() {
  const { user } = await verifySession()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Product Analytics</h1>
        <p className="text-muted-foreground">
          Track user events, conversion funnels, and retention from PostHog
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        }
      >
        <ProductAnalyticsDashboard />
      </Suspense>
    </div>
  )
}
