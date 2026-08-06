'use client'

/**
 * CustomerSupportDashboard Component
 *
 * Main dashboard showing Intercom customer support metrics.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { SupportMetrics } from './SupportMetrics'
import { ConversationsList } from './ConversationsList'
import { getIntegrations, syncIntegration } from '@/lib/actions/integrations'
import {
  getIntercomConversationsWithMock,
  getIntercomMetricsWithMock,
} from '@/lib/actions/data-with-mocks'
import type {
  Integration,
  IntercomConversation,
  IntercomMetrics,
} from '@/types/integrations'
import Link from 'next/link'

type TabType = 'overview' | 'open' | 'pending' | 'resolved'

export function CustomerSupportDashboard() {
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [conversations, setConversations] = useState<IntercomConversation[]>([])
  const [metrics, setMetrics] = useState<IntercomMetrics | null>(null)
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
      // Get integration status (for UI purposes)
      const intResult = await getIntegrations()
      if (intResult.success) {
        const intercomInt = intResult.data.find((i) => i.type === 'intercom')
        setIntegration(intercomInt || null)
      }

      // Always fetch data - returns mock data if Intercom not connected
      const [conversationsResult, metricsResult] = await Promise.all([
        getIntercomConversationsWithMock(100),
        getIntercomMetricsWithMock(30),
      ])

      if (conversationsResult.success) setConversations(conversationsResult.data)
      if (metricsResult.success && metricsResult.data.length > 0) {
        setMetrics(metricsResult.data[0])
      }
    } catch (err) {
      console.error('Error loading customer support data:', err)
      setError('Failed to load customer support data.')
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
      setError('Failed to sync Intercom data.')
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

  // Check if using mock data
  const isUsingMockData = !integration || integration.status !== 'active'

  const openConversations = conversations.filter(c => c.status === 'open')
  const pendingConversations = conversations.filter(c => c.status === 'pending')
  const resolvedConversations = conversations.filter(c => c.status === 'resolved' || c.status === 'closed')

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'open' as const, label: 'Open', count: openConversations.length },
    { id: 'pending' as const, label: 'Pending', count: pendingConversations.length },
    { id: 'resolved' as const, label: 'Resolved', count: resolvedConversations.length },
  ]

  return (
    <div className="space-y-6">
      {/* Sample data banner when Intercom not connected */}
      {isUsingMockData && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Viewing Sample Data
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Connect Intercom to see your real customer support metrics
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href="/integrations">Connect Intercom</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Header - only when connected */}
      {integration && integration.status === 'active' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <p className="font-medium">{integration.name}</p>
              <p className="text-xs text-muted-foreground">Intercom</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Connected
            </span>
          </div>

          <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync Now
              </>
            )}
          </Button>
        </div>
      )}

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
          <SupportMetrics metrics={metrics} conversations={conversations} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Recent Open</h3>
                <ConversationsList conversations={openConversations.slice(0, 5)} compact />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Recently Resolved</h3>
                <ConversationsList conversations={resolvedConversations.slice(0, 5)} compact />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'open' && (
        <Card>
          <CardContent className="pt-6">
            <ConversationsList conversations={openConversations} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'pending' && (
        <Card>
          <CardContent className="pt-6">
            <ConversationsList conversations={pendingConversations} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'resolved' && (
        <Card>
          <CardContent className="pt-6">
            <ConversationsList conversations={resolvedConversations} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
