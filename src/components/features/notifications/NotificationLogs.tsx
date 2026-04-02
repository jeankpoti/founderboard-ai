'use client'

/**
 * NotificationLogs Component
 *
 * Displays recent Slack notification logs.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { SlackNotificationLog } from '@/types/integrations'

interface NotificationLogsProps {
  logs: SlackNotificationLog[]
}

const eventTypeLabels: Record<string, string> = {
  milestoneCompleted: 'Milestone',
  roadmapUpdated: 'Roadmap',
  taskCompleted: 'Task',
  documentShared: 'Document',
  teamMemberJoined: 'Team',
  fundraisingUpdate: 'Fundraising',
}

export function NotificationLogs({ logs }: NotificationLogsProps) {
  const [showCount, setShowCount] = useState(20)

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">{"[x]"}</div>
        <p className="text-muted-foreground">No notifications sent yet</p>
        <p className="text-sm text-muted-foreground">
          Notification history will appear here once events trigger.
        </p>
      </div>
    )
  }

  const visibleLogs = logs.slice(0, showCount)
  const successCount = logs.filter(l => l.status === 'sent').length
  const failedCount = logs.filter(l => l.status === 'failed').length

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">
          {logs.length} total notifications
        </span>
        <span className="text-green-600 dark:text-green-400">
          {successCount} sent
        </span>
        {failedCount > 0 && (
          <span className="text-red-600 dark:text-red-400">
            {failedCount} failed
          </span>
        )}
      </div>

      {/* Logs list */}
      <div className="space-y-2">
        {visibleLogs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card"
          >
            {/* Status indicator */}
            <div className="flex-shrink-0 mt-1">
              {log.status === 'sent' ? (
                <div className="w-2 h-2 rounded-full bg-green-500" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-red-500" />
              )}
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">
                  {eventTypeLabels[log.eventType] || log.eventType}
                </span>
                <span className="text-xs text-muted-foreground">
                  #{log.channelName}
                </span>
              </div>
              <p className="text-sm mt-1 truncate">{log.message}</p>
              {log.status === 'failed' && log.errorMessage && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {log.errorMessage}
                </p>
              )}
            </div>

            {/* Timestamp */}
            <div className="flex-shrink-0 text-xs text-muted-foreground">
              {formatDate(log.sentAt)}
            </div>
          </div>
        ))}
      </div>

      {logs.length > showCount && (
        <div className="text-center pt-2">
          <Button variant="outline" onClick={() => setShowCount(showCount + 20)}>
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) {
    return 'Just now'
  } else if (diffMins < 60) {
    return `${diffMins}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}
