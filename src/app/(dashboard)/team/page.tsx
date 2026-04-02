/**
 * Team Page
 *
 * Displays team members and allows management of the team.
 *
 * WHAT THIS PAGE DOES:
 * - Shows all team members in the organization
 * - Allows inviting new members (if you have permission)
 * - Allows changing roles and removing members
 * - Shows pending invitations
 *
 * PERMISSIONS:
 * - Owner: Can do everything including transfer ownership
 * - Admin: Can invite members, change roles, remove members
 * - Member: Can only view the team
 * - Viewer: Can only view the team
 */

import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { TeamSettings } from '@/components/features/settings'

/**
 * Server Component for the Team page.
 *
 * WHY IS THIS A SERVER COMPONENT?
 * - We need to check authentication before rendering
 * - We need to get the user's role to pass to the client component
 * - Server Components are more secure for auth checks
 */
export default async function TeamPage() {
  // Check authentication and get organization context
  const orgContext = await getOrgContext()

  // Redirect to onboarding if not authenticated
  if (!orgContext) {
    redirect('/onboarding')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Team</h1>
        <p className="text-muted-foreground">
          Manage your team members and their roles
        </p>
      </div>

      {/* Role explanation */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Owner role card */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">👑</span>
            <h3 className="font-medium">Owner</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Full access. Can transfer ownership and delete the organization.
          </p>
        </div>

        {/* Admin role card */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔑</span>
            <h3 className="font-medium">Admin</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Can manage team, settings, and all data.
          </p>
        </div>

        {/* Member role card */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">👤</span>
            <h3 className="font-medium">Member</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Can create and edit data. Limited settings access.
          </p>
        </div>

        {/* Viewer role card */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">👁️</span>
            <h3 className="font-medium">Viewer</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Read-only access. Cannot edit any data.
          </p>
        </div>
      </div>

      {/* Team Settings Component */}
      {/*
        We pass the current user's ID and role to the client component.
        This allows it to:
        - Know which member is the current user (can't remove yourself)
        - Know what actions the user is allowed to perform
      */}
      <TeamSettings
        currentUserId={orgContext.user.uid}
        role={orgContext.role}
      />
    </div>
  )
}
