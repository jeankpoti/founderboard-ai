/**
 * Integrations Page
 *
 * Main page for managing third-party integrations.
 */

import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { IntegrationsHub } from '@/components/features/integrations'

export const metadata = {
  title: 'Integrations | Founderboard',
  description: 'Connect your tools and sync data automatically',
}

export default async function IntegrationsPage() {
  const orgContext = await getOrgContext()

  if (!orgContext) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your favorite tools to sync data automatically.
        </p>
      </div>

      <IntegrationsHub />
    </div>
  )
}
