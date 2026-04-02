/**
 * Templates Page
 *
 * Main page for the Templates feature.
 * Displays a library of reusable templates.
 *
 * WHAT ARE TEMPLATES?
 * Templates are pre-written content structures with placeholders.
 * Users can quickly create consistent documents by filling in
 * the variable values in a template.
 */

import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { TemplateLibrary } from '@/components/features/templates'

/**
 * Page metadata for SEO.
 */
export const metadata = {
  title: 'Templates | Founderboard',
  description: 'Reusable templates for notes, documents, and more',
}

/**
 * Templates page component.
 */
export default async function TemplatesPage() {
  // Check authentication
  const orgContext = await getOrgContext()

  if (!orgContext) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <p className="text-muted-foreground">
          Reusable templates to help you create consistent content quickly.
        </p>
      </div>

      {/* Template Library */}
      <TemplateLibrary />
    </div>
  )
}
