/**
 * Investors Page
 *
 * This is the main page for the Investor CRM feature.
 * It displays a Kanban board of all your investors organized by pipeline stage.
 *
 * PAGE STRUCTURE IN NEXT.JS:
 * - Files named page.tsx in the app folder become routes
 * - This file at app/(dashboard)/investors/page.tsx → /investors URL
 * - The (dashboard) folder is a "route group" - doesn't affect the URL
 *
 * SERVER vs CLIENT COMPONENTS:
 * - This is a Server Component (no 'use client' directive)
 * - It can do server-side checks (like auth) before rendering
 * - It renders the InvestorPipeline client component which handles interactivity
 */

import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { InvestorPipeline } from '@/components/features/investors'

/**
 * Metadata for the page (SEO, browser tab title)
 */
export const metadata = {
  title: 'Investors | Founderboard',
  description: 'Manage your investor pipeline and track fundraising progress',
}

/**
 * Main page component.
 *
 * This is an async function because it needs to check auth.
 * Server Components can be async - they run on the server.
 */
export default async function InvestorsPage() {
  // Check if user is authenticated and has an organization
  const orgContext = await getOrgContext()

  if (!orgContext) {
    // Redirect to login if not authenticated
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Investors</h1>
        <p className="text-muted-foreground">
          Track and manage your investor relationships through the fundraising pipeline.
        </p>
      </div>

      {/* Pipeline Board */}
      <InvestorPipeline />
    </div>
  )
}
