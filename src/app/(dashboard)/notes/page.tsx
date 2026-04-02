/**
 * Notes Page
 *
 * Main page for the Notes feature.
 * Displays a list of notes with search and category filtering.
 *
 * WHY IS THIS A SERVER COMPONENT?
 * This is an async server component that:
 * 1. Checks authentication on the server
 * 2. Renders the initial page structure
 * 3. Passes control to client components for interactivity
 */

import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { NotesPage } from '@/components/features/notes'

/**
 * Page metadata for SEO.
 *
 * WHAT IS METADATA?
 * Next.js uses this to set the page title and description
 * that appear in browser tabs and search results.
 */
export const metadata = {
  title: 'Notes | Founderboard',
  description: 'Write and organize your thoughts and meeting notes',
}

/**
 * Notes page component.
 */
export default async function NotesPageRoute() {
  // Check authentication
  const orgContext = await getOrgContext()

  if (!orgContext) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
        <p className="text-muted-foreground">
          Write and organize your thoughts, meeting notes, and ideas.
        </p>
      </div>

      {/* Notes Content */}
      <NotesPage />
    </div>
  )
}
