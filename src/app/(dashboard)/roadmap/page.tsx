/**
 * Roadmap Page
 *
 * Main page for the Product Roadmap feature.
 */

import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { RoadmapView } from '@/components/features/roadmap'

export const metadata = {
  title: 'Roadmap | Founderboard',
  description: 'Plan and track your product development timeline',
}

export default async function RoadmapPage() {
  const orgContext = await getOrgContext()

  if (!orgContext) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Product Roadmap</h1>
        <p className="text-muted-foreground">
          Plan, visualize, and track your product development timeline.
        </p>
      </div>

      <RoadmapView />
    </div>
  )
}
