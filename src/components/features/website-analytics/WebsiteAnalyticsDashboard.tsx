'use client'

/**
 * WebsiteAnalyticsDashboard Component
 *
 * Main dashboard showing Google Analytics data.
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { TrafficMetrics } from './TrafficMetrics'
import { TrafficChart } from './TrafficChart'
import { TrafficSources } from './TrafficSources'
import { TopPages } from './TopPages'
import { getIntegrations, syncIntegration } from '@/lib/actions/integrations'
import {
  getGoogleAnalyticsMetricsWithMock,
  getGoogleAnalyticsPagesWithMock,
  getGoogleAnalyticsSourcesWithMock,
} from '@/lib/actions/data-with-mocks'
import type {
  Integration,
  GoogleAnalyticsMetrics,
  GoogleAnalyticsPageView,
  GoogleAnalyticsTrafficSource,
} from '@/types/integrations'
import Link from 'next/link'

export type WebsiteAnalyticsDateRange = '7d' | '30d' | '90d' | 'all'

function getDateRangeParams(dateRange: WebsiteAnalyticsDateRange): {
  startDate: string
  endDate: string
} {
  const endDate = 'today'

  switch (dateRange) {
    case '7d':
      return { startDate: '7daysAgo', endDate }
    case '30d':
      return { startDate: '30daysAgo', endDate }
    case '90d':
      return { startDate: '90daysAgo', endDate }
    case 'all':
      // The Data API returns only the available history for the property.
      return { startDate: '2005-01-01', endDate }
  }
}

export function WebsiteAnalyticsDashboard() {
  // State
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [metrics, setMetrics] = useState<GoogleAnalyticsMetrics[]>([])
  const [pages, setPages] = useState<GoogleAnalyticsPageView[]>([])
  const [sources, setSources] = useState<GoogleAnalyticsTrafficSource[]>([])
  const [dateRange, setDateRange] = useState<WebsiteAnalyticsDateRange>('30d')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load Google Analytics integration and data.
   * Data is always loaded - mock data is used when GA is not connected.
   */
  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
    }
    setError(null)

    try {
      // Get integration status (for UI purposes)
      const intResult = await getIntegrations()
      if (intResult.success) {
        const gaIntegration = intResult.data.find((i) => i.type === 'google_analytics')
        setIntegration(gaIntegration || null)
      }

      // Calculate days based on date range
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 30

      // Always fetch data - returns mock data if GA not connected
      const [metricsResult, pagesResult, sourcesResult] = await Promise.all([
        getGoogleAnalyticsMetricsWithMock(days),
        getGoogleAnalyticsPagesWithMock(days),
        getGoogleAnalyticsSourcesWithMock(days),
      ])

      if (metricsResult.success) setMetrics(metricsResult.data)
      if (pagesResult.success) setPages(pagesResult.data)
      if (sourcesResult.success) setSources(sourcesResult.data)
    } catch (err) {
      console.error('Error loading analytics data:', err)
      setError('Failed to load analytics data.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [dateRange])

  // Fetch data on mount (initial load)
  useEffect(() => {
    loadData(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refresh data when date range changes (not initial load)
  useEffect(() => {
    if (!isLoading) {
      loadData(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange])

  /**
   * Trigger sync for Google Analytics integration.
   */
  async function handleSync() {
    if (!integration) return

    setIsSyncing(true)

    try {
      await syncIntegration(integration.id)
      // Reload data after sync
      await loadData()
    } catch (err) {
      console.error('Error syncing:', err)
      setError('Failed to sync Google Analytics data.')
    } finally {
      setIsSyncing(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  // Check if using mock data
  const isUsingMockData = !integration || integration.status !== 'active'

  return (
    <div className="space-y-6">
      {/* Sample data banner when GA not connected */}
      {isUsingMockData && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Viewing Sample Data
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Connect Google Analytics to see your real website traffic
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href="/integrations">Connect Google Analytics</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Header with integration status and sync button - only when connected */}
      {integration && integration.status === 'active' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <p className="font-medium">{integration.name}</p>
              <p className="text-xs text-muted-foreground">Google Analytics</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Connected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {integration.lastSyncAt && (
              <span className="text-xs text-muted-foreground">
                Last sync: {new Date(integration.lastSyncAt).toLocaleDateString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Sync Now
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Metrics Overview */}
      <TrafficMetrics metrics={metrics} />

      {/* Traffic Chart */}
      <Card className={`relative transition-opacity ${isRefreshing ? 'opacity-60' : ''}`}>
        <CardContent className="pt-6">
          <TrafficChart
            metrics={metrics}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </CardContent>
      </Card>

      {/* Traffic Sources and Top Pages */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity ${isRefreshing ? 'opacity-60' : ''}`}>
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
            <TrafficSources sources={sources} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Top Pages</h3>
            <TopPages pages={pages} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
