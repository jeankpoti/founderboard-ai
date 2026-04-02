'use client'

/**
 * NotificationsDashboard Component
 *
 * Main dashboard for Slack notification configuration.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { NotificationConfig } from './NotificationConfig'
import { NotificationLogs } from './NotificationLogs'
import {
  getIntegrations,
  getSlackConfig,
  updateSlackConfig,
  getSlackNotificationLogs,
} from '@/lib/actions/integrations'
import type {
  Integration,
  SlackNotificationConfig,
  SlackNotificationLog,
} from '@/types/integrations'
import Link from 'next/link'

type TabType = 'config' | 'history'

export function NotificationsDashboard() {
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [config, setConfig] = useState<SlackNotificationConfig | null>(null)
  const [logs, setLogs] = useState<SlackNotificationLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('config')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    setError(null)

    try {
      const intResult = await getIntegrations()
      if (!intResult.success) {
        setError(intResult.error.message)
        return
      }

      const slackInt = intResult.data.find((i) => i.type === 'slack')
      setIntegration(slackInt || null)

      if (slackInt && slackInt.status === 'active') {
        const [configResult, logsResult] = await Promise.all([
          getSlackConfig(slackInt.id),
          getSlackNotificationLogs(slackInt.id, 100),
        ])

        if (configResult.success) setConfig(configResult.data)
        if (logsResult.success) setLogs(logsResult.data)
      }
    } catch (err) {
      console.error('Error loading notifications data:', err)
      setError('Failed to load notification settings.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveConfig(events: SlackNotificationConfig['events']) {
    if (!integration) return

    try {
      const result = await updateSlackConfig(integration.id, { events })
      if (result.success && result.data) {
        setConfig(result.data)
      } else if (!result.success) {
        setError(result.error.message)
      }
    } catch (err) {
      console.error('Error saving config:', err)
      setError('Failed to save notification settings.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!integration) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="text-5xl">{"[x]"}</div>
            <h3 className="text-lg font-semibold">Connect Slack</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Connect your Slack workspace to receive notifications about important events directly in your channels.
            </p>
            <Button asChild>
              <Link href="/integrations">Connect Slack</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sentCount = logs.filter(l => l.status === 'sent').length
  const failedCount = logs.filter(l => l.status === 'failed').length

  const tabs = [
    { id: 'config' as const, label: 'Configuration' },
    { id: 'history' as const, label: 'History', count: logs.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{"[x]"}</span>
          <div>
            <p className="font-medium">{integration.name}</p>
            <p className="text-xs text-muted-foreground">Slack</p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              integration.status === 'active'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}
          >
            {integration.status}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>{sentCount} sent</span>
          </div>
          {failedCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>{failedCount} failed</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'config' && (
        <NotificationConfig config={config} onSave={handleSaveConfig} />
      )}

      {activeTab === 'history' && (
        <Card>
          <CardContent className="pt-6">
            <NotificationLogs logs={logs} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
