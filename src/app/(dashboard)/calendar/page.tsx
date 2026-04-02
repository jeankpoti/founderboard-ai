/**
 * Calendar Page
 *
 * Main page for the Calendar feature.
 */

import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { CalendarView } from '@/components/features/calendar'

export const metadata = {
  title: 'Calendar | Founderboard',
  description: 'Manage your meetings, deadlines, and events',
}

export default async function CalendarPage() {
  const orgContext = await getOrgContext()

  if (!orgContext) {
    redirect('/sign-in')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          Schedule and manage meetings, deadlines, and important events.
        </p>
      </div>

      <CalendarView />
    </div>
  )
}
