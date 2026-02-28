'use client'

/**
 * Notifications Page
 *
 * Slack notification configuration and logs.
 */

import { NotificationsDashboard } from '@/components/features/notifications'

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">
          Configure Slack notifications and view notification history.
        </p>
      </div>

      <NotificationsDashboard />
    </div>
  )
}
