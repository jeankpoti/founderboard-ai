'use client'

/**
 * NotificationConfig Component
 *
 * Configure which events trigger Slack notifications.
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { SlackNotificationConfig } from '@/types/integrations'

interface NotificationConfigProps {
  config: SlackNotificationConfig | null
  onSave: (events: SlackNotificationConfig['events']) => Promise<void>
}

const eventOptions = [
  {
    key: 'milestoneCompleted' as const,
    label: 'Milestone Completed',
    description: 'Get notified when a milestone is marked complete',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    key: 'roadmapUpdated' as const,
    label: 'Roadmap Updated',
    description: 'Get notified when roadmap items are added or changed',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    key: 'taskCompleted' as const,
    label: 'Task Completed',
    description: 'Get notified when tasks are completed',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    key: 'documentShared' as const,
    label: 'Document Shared',
    description: 'Get notified when documents are shared with the team',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: 'teamMemberJoined' as const,
    label: 'Team Member Joined',
    description: 'Get notified when new team members join',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    key: 'fundraisingUpdate' as const,
    label: 'Fundraising Update',
    description: 'Get notified on fundraising progress and investor updates',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export function NotificationConfig({ config, onSave }: NotificationConfigProps) {
  const [events, setEvents] = useState<SlackNotificationConfig['events']>(
    config?.events || {
      milestoneCompleted: true,
      roadmapUpdated: true,
      taskCompleted: false,
      documentShared: true,
      teamMemberJoined: true,
      fundraisingUpdate: true,
    }
  )
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleToggle = (key: keyof SlackNotificationConfig['events']) => {
    setEvents((prev) => ({ ...prev, [key]: !prev[key] }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(events)
      setHasChanges(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notification Events</CardTitle>
        {hasChanges && (
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {eventOptions.map((option) => (
            <label
              key={option.key}
              className="flex items-start gap-4 p-3 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              <div className="flex-shrink-0">
                <button
                  type="button"
                  role="switch"
                  aria-checked={events[option.key]}
                  onClick={() => handleToggle(option.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    events[option.key] ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      events[option.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </label>
          ))}
        </div>

        {config?.defaultChannelName && (
          <div className="mt-6 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Notifications will be sent to{' '}
              <span className="font-medium text-foreground">#{config.defaultChannelName}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
