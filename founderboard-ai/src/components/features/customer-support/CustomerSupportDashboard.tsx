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
import {
  getIntegrations,
  getIntercomConversations,
  getIntercomMetrics,
  syncIntegration,
} from '@/lib/actions/integrations'
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
      const intResult = await getIntegrations()
      if (!intResult.success) {
        setError(intResult.error.message)
        return
      }

      const intercomInt = intResult.data.find((i) => i.type === 'intercom')
      setIntegration(intercomInt || null)

      if (intercomInt && intercomInt.status === 'active') {
        const [conversationsResult, metricsResult] = await Promise.all([
          getIntercomConversations(intercomInt.id, 100),
          getIntercomMetrics(intercomInt.id),
        ])

        if (conversationsResult.success) setConversations(conversationsResult.data)
        if (metricsResult.success && metricsResult.data.length > 0) {
          setMetrics(metricsResult.data[0])
        }
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

  if (!integration) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="text-5xl">{"[x]"}</div>
            <h3 className="text-lg font-semibold">Connect Intercom</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Connect your Intercom account to see customer conversations, response times, and satisfaction scores.
            </p>
            <Button asChild>
              <Link href="/integrations">Connect Intercom</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{"[x]"}</span>
          <div>
            <p className="font-medium">{integration.name}</p>
            <p className="text-xs text-muted-foreground">Intercom</p>
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
