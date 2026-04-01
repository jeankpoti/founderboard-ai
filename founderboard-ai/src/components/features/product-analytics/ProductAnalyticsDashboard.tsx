'use client'

/**
 * ProductAnalyticsDashboard Component
 *
 * Main dashboard showing PostHog product analytics.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { EventsMetrics } from './EventsMetrics'
import { EventsList } from './EventsList'
import { FunnelChart } from './FunnelChart'
import {
  getIntegrations,
  getPostHogEvents,
  getPostHogFunnels,
  getPostHogRetention,
  syncIntegration,
} from '@/lib/actions/integrations'
import type {
  Integration,
  PostHogEvent,
  PostHogFunnel,
  PostHogRetention,
} from '@/types/integrations'
import Link from 'next/link'

type TabType = 'overview' | 'events' | 'funnels' | 'retention'

export function ProductAnalyticsDashboard() {
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [events, setEvents] = useState<PostHogEvent[]>([])
  const [funnels, setFunnels] = useState<PostHogFunnel[]>([])
  const [retention, setRetention] = useState<PostHogRetention[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

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

      const posthogInt = intResult.data.find((i) => i.type === 'posthog')
      setIntegration(posthogInt || null)

      if (posthogInt && posthogInt.status === 'active') {
        const [eventsResult, funnelsResult, retentionResult] = await Promise.all([
          getPostHogEvents(posthogInt.id, 50),
          getPostHogFunnels(posthogInt.id),
          getPostHogRetention(posthogInt.id),
        ])

        if (eventsResult.success) setEvents(eventsResult.data)
        if (funnelsResult.success) setFunnels(funnelsResult.data)
        if (retentionResult.success) setRetention(retentionResult.data)
      }
    } catch (err) {
      console.error('Error loading product analytics:', err)
      setError('Failed to load product analytics data.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSync() {
    if (!integration) return
    setIsSyncing(true)

    try {
      await syncIntegration(integration.id)
      await loadData()
    } catch (err) {
      console.error('Error syncing:', err)
      setError('Failed to refresh PostHog data.')
    } finally {
      setIsSyncing(false)
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
            <h3 className="text-lg font-semibold">Connect PostHog</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Connect your PostHog account to see user events, funnels, and retention data.
            </p>
            <Button asChild>
              <Link href="/integrations">Connect PostHog</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'events' as const, label: 'Events', count: events.length },
    { id: 'funnels' as const, label: 'Funnels', count: funnels.length },
    { id: 'retention' as const, label: 'Retention', count: retention.length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{"[x]"}</span>
          <div>
            <p className="font-medium">{integration.name}</p>
            <p className="text-xs text-muted-foreground">PostHog</p>
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

        <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? (
            <>
              <Spinner className="h-4 w-4 mr-2" />
              Refreshing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </>
          )}
        </Button>
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
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <EventsMetrics events={events} retention={retention} funnels={funnels} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Top Events</h3>
                <EventsList events={events.slice(0, 5)} compact />
              </CardContent>
            </Card>
            {funnels.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
                  <FunnelChart funnel={funnels[0]} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <Card>
          <CardContent className="pt-6">
            <EventsList events={events} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'funnels' && (
        <div className="space-y-6">
          {funnels.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-muted-foreground">No funnels configured yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            funnels.map((funnel) => (
              <Card key={funnel.id}>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">{funnel.name}</h3>
                  <FunnelChart funnel={funnel} />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'retention' && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Retention Cohorts</h3>
            {retention.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No retention data yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Cohort</th>
                      <th className="text-right py-2 px-2">Users</th>
                      <th className="text-right py-2 px-2">Day 1</th>
                      <th className="text-right py-2 px-2">Day 7</th>
                      <th className="text-right py-2 px-2">Day 14</th>
                      <th className="text-right py-2 px-2">Day 30</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retention.map((r) => (
                      <tr key={r.id} className="border-b">
                        <td className="py-2 px-2">{new Date(r.cohortDate).toLocaleDateString()}</td>
                        <td className="text-right py-2 px-2">{r.day0Users.toLocaleString()}</td>
                        <td className="text-right py-2 px-2">{r.day1}%</td>
                        <td className="text-right py-2 px-2">{r.day7}%</td>
                        <td className="text-right py-2 px-2">{r.day14}%</td>
                        <td className="text-right py-2 px-2">{r.day30}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
