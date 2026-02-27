/**
 * Activity Page
 *
 * This page displays the organization's activity feed.
 *
 * PAGE COMPONENT PATTERNS IN NEXT.JS:
 * - This file is automatically a route because of its location
 * - Path: src/app/(dashboard)/activity/page.tsx → URL: /activity
 * - The (dashboard) folder is a "route group" - it doesn't affect the URL
 * - "page.tsx" is a special filename that Next.js recognizes as a page
 *
 * SERVER VS CLIENT COMPONENTS:
 * - By default, Next.js pages are Server Components
 * - Server Components run on the server and can access databases directly
 * - They can't use useState, useEffect, or browser APIs
 * - We use Server Components for the page shell and data fetching
 * - We pass data to Client Components for interactive parts
 */

// No 'use client' here - this is a Server Component
import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { ActivityFeed } from '@/components/features/activity'

/**
 * The page component is an async function because we need to:
 * 1. Check authentication (async operation)
 * 2. Fetch initial data if needed (async operation)
 *
 * ASYNC/AWAIT:
 * - "async" keyword means this function can use "await"
 * - "await" pauses execution until a Promise resolves
 * - This makes async code read like synchronous code
 */
export default async function ActivityPage() {
  // ----------------------------------------
  // AUTHENTICATION CHECK
  // ----------------------------------------

  /**
   * getOrgContext() returns the current user's organization context.
   * It returns null if:
   * - User is not logged in
   * - User hasn't selected an organization
   * - Session is invalid
   */
  const orgContext = await getOrgContext()

  // If not authenticated, redirect to onboarding
  // redirect() throws an error internally, so no return needed
  if (!orgContext) {
    redirect('/onboarding')
  }

  // ----------------------------------------
  // RENDER
  // ----------------------------------------

  /**
   * The page structure:
   * 1. Page header with title and description
   * 2. The ActivityFeed component (handles its own data fetching)
   *
   * WHY FETCH DATA IN THE COMPONENT?
   * - ActivityFeed is a Client Component that needs to be interactive
   * - It handles loading states, pagination, and refresh
   * - Server-side initial data could be passed as props for faster first paint
   */
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Activity</h1>
        <p className="text-muted-foreground">
          See what&apos;s happening across your organization
        </p>
      </div>

      {/* Activity Feed Component */}
      <ActivityFeed />
    </div>
  )
}
