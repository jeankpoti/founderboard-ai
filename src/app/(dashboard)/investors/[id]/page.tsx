/**
 * Investor Detail Page
 *
 * Shows detailed information about a single investor, including:
 * - Contact information
 * - Pipeline stage
 * - Meetings history
 * - Interaction timeline
 *
 * DYNAMIC ROUTES IN NEXT.JS:
 * - Files with [brackets] are dynamic routes
 * - [id] captures the URL segment as a parameter
 * - /investors/abc123 → params.id = "abc123"
 *
 * This lets us have one page component that works for any investor.
 */

import { redirect, notFound } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { getInvestor } from '@/lib/actions/investors'
import { InvestorDetailView } from './InvestorDetailView'

/**
 * Generate dynamic metadata based on the investor name.
 *
 * generateMetadata is a special Next.js function that runs on the server
 * to create page-specific metadata (title, description, etc.)
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const result = await getInvestor(id)

  if (!result.success) {
    return {
      title: 'Investor Not Found | Founderboard',
    }
  }

  return {
    title: `${result.data.name} | Investors | Founderboard`,
    description: `View details for investor ${result.data.name}${
      result.data.firm ? ` from ${result.data.firm}` : ''
    }`,
  }
}

/**
 * Main page component.
 *
 * PARAMS PROP:
 * - Next.js passes route parameters as props
 * - For /investors/[id], we get { params: { id: "..." } }
 */
export default async function InvestorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Check authentication
  const orgContext = await getOrgContext()

  if (!orgContext) {
    redirect('/sign-in')
  }

  // Fetch the investor
  const { id } = await params
  const result = await getInvestor(id)

  // Handle not found
  if (!result.success) {
    if (result.error.code === 'NOT_FOUND') {
      notFound() // Shows Next.js 404 page
    }
    // For other errors, also show not found
    notFound()
  }

  return <InvestorDetailView investor={result.data} />
}
