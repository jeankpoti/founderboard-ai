/**
 * Website Analytics Page
 *
 * Displays Google Analytics data: sessions, users, pageviews,
 * traffic sources, and top pages.
 */

import { Suspense } from 'react'
import { verifySession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { WebsiteAnalyticsDashboard } from '@/components/features/website-analytics'
import { Spinner } from '@/components/ui/spinner'

export const metadata = {
  title: 'Website Analytics | Founderboard',
  description: 'Track website traffic and user behavior from Google Analytics',
}

export default async function WebsiteAnalyticsPage() {
  // Verify authentication
  const { user } = await verifySession()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Website Analytics</h1>
        <p className="text-muted-foreground">
          Track sessions, users, pageviews, and traffic sources from Google Analytics
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
        <WebsiteAnalyticsDashboard />
      </Suspense>
    </div>
  )
}
