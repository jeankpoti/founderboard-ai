/**
 * Dashboard Layout
 *
 * This layout wraps all dashboard pages and provides:
 * - Sidebar navigation
 * - Organization switcher
 * - User info and sign out
 * - Authentication checks
 *
 * LAYOUT COMPONENTS IN NEXT.JS:
 * - layout.tsx files wrap all pages in that folder (and subfolders)
 * - They persist across page navigation (don't re-render)
 * - Great for things like sidebars and headers
 */

import { verifySession } from '@/lib/auth/session'
import { getOrgContext, getUserOrganizations } from '@/lib/auth/org-context'
import { getGuestOrgContext, GUEST_USER } from '@/lib/auth/guest-context'
import { GuestBanner } from '@/components/features/auth'
import { Sidebar, DashboardHeader } from '@/components/features/layout'
import { WelcomeDialog } from '@/components/features/welcome'

// ========================================
// NAVIGATION CONFIGURATION
// ========================================

/**
 * Navigation items for the sidebar.
 *
 * WHY DEFINE NAVIGATION AS DATA?
 * - Easier to maintain - add/remove items in one place
 * - Can be reused for mobile navigation
 * - Makes the JSX cleaner
 *
 * Each item has:
 * - name: Display text
 * - href: URL path
 * - icon: SVG path for the icon (from Heroicons)
 * - section: Optional section header to display above this item
 */
const navigationItems = [
  // ----------------------------------------
  // Main section
  // ----------------------------------------
  {
    name: 'Dashboard',
    href: '/dashboard',
    // Home icon
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    name: 'AI Studio',
    href: '/ai-studio',
    // Lightbulb/sparkles icon
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  },

  // ----------------------------------------
  // Team & Collaboration section
  // ----------------------------------------
  {
    name: 'Team',
    href: '/team',
    section: 'Team', // This creates a section header
    // Users icon
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  },
  {
    name: 'Activity',
    href: '/activity',
    // Activity/feed icon
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },

  // ----------------------------------------
  // Business section
  // ----------------------------------------
  {
    name: 'Investors',
    href: '/investors',
    section: 'Business', // Section header
    // Briefcase/business icon
    icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    name: 'App Analytics',
    href: '/app-analytics',
    // Chart/analytics icon with phone
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    name: 'Revenue',
    href: '/revenue',
    // Credit card/payment icon
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
  {
    name: 'Dev Insights',
    href: '/dev-insights',
    // Code/terminal icon
    icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    name: 'Website Analytics',
    href: '/website-analytics',
    // Chart/analytics icon
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    name: 'Product Analytics',
    href: '/product-analytics',
    // Lightning bolt/events icon
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    name: 'Customer Support',
    href: '/customer-support',
    // Chat/support icon
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  },
  {
    name: 'Fundraising',
    href: '/fundraising',
    // Dollar/money icon
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    name: 'OKRs',
    href: '/okrs',
    // Target/goal icon
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },

  // ----------------------------------------
  // Content section
  // ----------------------------------------
  {
    name: 'Documents',
    href: '/documents',
    section: 'Content', // Section header
    // Folder/documents icon
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  },
  {
    name: 'Notes',
    href: '/notes',
    // Document/notes icon
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    name: 'Templates',
    href: '/templates',
    // Template/document-duplicate icon
    icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2',
  },

  // ----------------------------------------
  // Planning section
  // ----------------------------------------
  {
    name: 'Roadmap',
    href: '/roadmap',
    section: 'Planning', // Section header
    // Map/roadmap icon
    icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  },
  {
    name: 'Calendar',
    href: '/calendar',
    // Calendar icon
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    name: 'Tasks',
    href: '/tasks',
    // Clipboard/tasks icon
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },

  // ----------------------------------------
  // Settings section (at bottom)
  // ----------------------------------------
  {
    name: 'Integrations',
    href: '/integrations',
    section: 'Settings', // Section header
    // Puzzle/integrations icon
    icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
  },
  {
    name: 'Notifications',
    href: '/notifications',
    // Bell/notification icon
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },
  {
    name: 'Settings',
    href: '/settings',
    // Cog/settings icon
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
]

// ========================================
// LAYOUT COMPONENT
// ========================================

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ----------------------------------------
  // AUTHENTICATION (with Guest Mode Support)
  // ----------------------------------------

  // Verify the user's session (checks the auth cookie)
  const { user, error } = await verifySession()

  // Determine if this is a guest (unauthenticated) user
  const isGuest = !user
  const effectiveUser = user || GUEST_USER

  // For authenticated users, check if they need onboarding
  const needsOnboarding = !isGuest && (!user.linkedOrgIds || user.linkedOrgIds.length === 0)

  // Get org context:
  // - Guest users get the demo org context
  // - Authenticated users get their real org context
  // - Users needing onboarding get null
  let orgContext = null
  let organizations: Awaited<ReturnType<typeof getUserOrganizations>> = []

  if (isGuest) {
    // Guest mode - use demo organization
    orgContext = getGuestOrgContext()
  } else if (!needsOnboarding) {
    // Authenticated user with organizations
    orgContext = await getOrgContext()
    organizations = await getUserOrganizations()
  }

  // ----------------------------------------
  // RENDER
  // ----------------------------------------

  return (
    <div className="min-h-screen flex flex-col">
      {/* Guest Banner - shown for unauthenticated users */}
      {isGuest && <GuestBanner />}

      <div className="flex-1 flex">
        {/* ======================================== */}
        {/* SIDEBAR - hidden during onboarding and on mobile */}
        {/* ======================================== */}
        {!needsOnboarding && orgContext && (
          <Sidebar
            currentOrg={orgContext.organization}
            organizations={isGuest ? [] : organizations}
            userEmail={effectiveUser.email}
            navigationItems={navigationItems}
          />
        )}

        {/* ======================================== */}
        {/* MAIN CONTENT AREA */}
        {/* ======================================== */}
        <main className="flex-1">
          {/* Top Header Bar with Info Button */}
          <DashboardHeader
            orgName={orgContext?.organization.name || 'Dashboard'}
            role={orgContext?.role}
            email={effectiveUser.email}
            isGuest={isGuest}
            needsOnboarding={needsOnboarding}
          />

          {/* Page Content */}
          <div className="p-6">{children}</div>
        </main>
      </div>

      {/* Welcome Dialog - auto-shows on first visit */}
      <WelcomeDialog />
    </div>
  )
}
