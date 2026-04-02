import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ProfileSettings,
  OrganizationSettings,
  TeamSettings,
  ThemeToggle,
} from '@/components/features/settings'

export default async function SettingsPage() {
  const orgContext = await getOrgContext()

  if (!orgContext) {
    redirect('/onboarding')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, organization, and team settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileSettings
            user={{
              uid: orgContext.user.uid,
              email: orgContext.user.email || '',
              displayName: orgContext.user.displayName || '',
            }}
          />
        </TabsContent>

        <TabsContent value="organization" className="space-y-6">
          <OrganizationSettings
            organization={{
              id: orgContext.organization.id,
              name: orgContext.organization.name,
            }}
            role={orgContext.role}
          />
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <TeamSettings
            currentUserId={orgContext.user.uid}
            role={orgContext.role}
          />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <ThemeToggle />
        </TabsContent>
      </Tabs>
    </div>
  )
}
