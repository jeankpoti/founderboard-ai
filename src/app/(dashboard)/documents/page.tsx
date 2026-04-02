/**
 * Documents Page
 *
 * Main page for the Documents feature.
 * Displays a file library with upload and organization capabilities.
 */

import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { DocumentLibrary } from '@/components/features/documents'

export const metadata = {
  title: 'Documents | Founderboard',
  description: 'Store and organize your important documents',
}

export default async function DocumentsPage() {
  const orgContext = await getOrgContext()

  if (!orgContext) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Store, organize, and share your important files.
        </p>
      </div>

      <DocumentLibrary />
    </div>
  )
}
