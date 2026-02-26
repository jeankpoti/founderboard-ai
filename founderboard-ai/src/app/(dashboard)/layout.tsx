import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth/session'
import { getOrgContext, getUserOrganizations } from '@/lib/auth/org-context'
import { SignOutButton } from '@/components/features/auth'
import { OrgSwitcher } from '@/components/features/organization'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verify session on server side
  const { user, error } = await verifySession()

  if (!user) {
    console.error('Dashboard access denied:', error)
    redirect('/login')
  }

  // Check if user needs to complete onboarding (no organizations)
  const needsOnboarding = !user.linkedOrgIds || user.linkedOrgIds.length === 0

  // Get org context and all user organizations
  const orgContext = needsOnboarding ? null : await getOrgContext()
  const organizations = needsOnboarding ? [] : await getUserOrganizations()

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - hidden during onboarding */}
      {!needsOnboarding && orgContext && (
        <aside className="w-64 border-r bg-muted/30 p-4 hidden md:flex md:flex-col">
          {/* Org Switcher */}
          <div className="mb-6">
            <OrgSwitcher
              currentOrg={orgContext.organization}
              organizations={organizations}
            />
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1">
            <a
              href="/dashboard"
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </a>
            <a
              href="/ai-studio"
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Studio
            </a>
            <a
              href="/tasks"
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Tasks
            </a>
            <a
              href="/settings"
              className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md hover:bg-muted"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </a>
          </nav>

          {/* User section */}
          <div className="pt-4 border-t space-y-2">
            <p className="text-xs text-muted-foreground px-2 truncate">
              {user.email}
            </p>
            <SignOutButton variant="outline" className="w-full" />
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1">
        {/* Header */}
        <header className="h-14 border-b flex items-center px-6 justify-between">
          {needsOnboarding ? (
            <p className="text-sm font-medium">Getting Started</p>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">
                {orgContext?.organization.name || 'Dashboard'}
              </p>
              {orgContext && (
                <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                  {orgContext.role}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground hidden sm:block">{user.email}</p>
            {needsOnboarding && (
              <SignOutButton variant="ghost" />
            )}
            {!needsOnboarding && (
              <div className="md:hidden">
                <SignOutButton variant="ghost" />
              </div>
            )}
          </div>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
