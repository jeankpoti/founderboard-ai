import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { KanbanBoard } from '@/components/features/kanban'

export default async function TasksPage() {
  const orgContext = await getOrgContext()

  if (!orgContext) {
    redirect('/onboarding')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">
          Manage your team&apos;s tasks with a Kanban board
        </p>
      </div>

      <KanbanBoard
        userRole={orgContext.role}
        currentUserId={orgContext.user.uid}
      />
    </div>
  )
}
