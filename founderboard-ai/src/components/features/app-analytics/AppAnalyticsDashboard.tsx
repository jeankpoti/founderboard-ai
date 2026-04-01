'use client'

/**
 * AppAnalyticsDashboard Component
 *
 * Main dashboard showing app analytics from connected app stores.
 * Combines data from App Store Connect and Google Play.
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { MetricsOverview } from './MetricsOverview'
import { ReviewsList } from './ReviewsList'
import { RatingDistribution } from './RatingDistribution'
import {
  getIntegrations,
  getAppStoreMetrics,
  getAppReviews,
  syncIntegration,
} from '@/lib/actions/integrations'
import type { Integration, AppStoreMetrics, AppReview } from '@/types/integrations'
import Link from 'next/link'

type Platform = 'all' | 'ios' | 'android'
type DateRange = '7d' | '30d' | '90d' | 'all'

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
  'all': 'All Time',
}

/**
 * Calculate start date based on range selection.
 */
function getStartDate(range: DateRange): string | undefined {
  if (range === 'all') return undefined

  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

export function AppAnalyticsDashboard() {
  // State
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [metrics, setMetrics] = useState<AppStoreMetrics[]>([])
  const [reviews, setReviews] = useState<AppReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [platform, setPlatform] = useState<Platform>('all')
  const [dateRange, setDateRange] = useState<DateRange>('7d')

  /**
   * Load integrations and their data.
   */
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get all integrations
      const intResult = await getIntegrations()
      if (!intResult.success) {
        setError(intResult.error.message)
        return
      }

      // Filter for app store integrations
      const appStoreIntegrations = intResult.data.filter(
        (i) => i.type === 'app_store_connect' || i.type === 'google_play'
      )
      setIntegrations(appStoreIntegrations)

      // Calculate date range
      const startDate = getStartDate(dateRange)
      const endDate = new Date().toISOString().split('T')[0]

      // Fetch metrics and reviews for each integration
      const allMetrics: AppStoreMetrics[] = []
      const allReviews: AppReview[] = []

      for (const integration of appStoreIntegrations) {
        if (integration.status === 'active') {
          // Get metrics with date range filter
          const metricsResult = await getAppStoreMetrics(
            integration.id,
            startDate,
            endDate
          )
          if (metricsResult.success) {
            allMetrics.push(...metricsResult.data)
          }

          // Get reviews
          const reviewsResult = await getAppReviews(integration.id)
          if (reviewsResult.success) {
            allReviews.push(...reviewsResult.data)
          }
        }
      }

      setMetrics(allMetrics)
      setReviews(allReviews)
    } catch (err) {
      console.error('Error loading app analytics:', err)
      setError('Failed to load app analytics data.')
    } finally {
      setIsLoading(false)
    }
  }, [dateRange])

  // Fetch data on mount and when dateRange changes
  useEffect(() => {
    loadData()
  }, [loadData])

  /**
   * Trigger sync for all app store integrations.
   */
  async function handleSync() {
    setIsSyncing(true)

    try {
      for (const integration of integrations) {
        if (integration.status === 'active') {
          await syncIntegration(integration.id)
        }
      }
      // Reload data after sync
      await loadData()
    } catch (err) {
      console.error('Error syncing:', err)
      setError('Failed to sync app data.')
    } finally {
      setIsSyncing(false)
    }
  }

  /**
   * Filter metrics by platform.
   */
  function getFilteredMetrics(): AppStoreMetrics[] {
    if (platform === 'all') return metrics
    return metrics.filter((m) => m.platform === platform)
  }

  /**
   * Filter reviews by platform.
   */
  function getFilteredReviews(): AppReview[] {
    if (platform === 'all') return reviews
    return reviews.filter((r) => r.platform === platform)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  // No integrations connected
  if (integrations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="text-5xl">📱</div>
            <h3 className="text-lg font-semibold">No App Store Integrations</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Connect App Store Connect or Google Play Console to see your app analytics here.
            </p>
            <Button asChild>
              <Link href="/integrations">Connect App Store</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get connected platforms
  const hasIOS = integrations.some((i) => i.type === 'app_store_connect')
  const hasAndroid = integrations.some((i) => i.type === 'google_play')

  return (
    <div className="space-y-6">
      {/* Header with sync button and platform filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Platform badges */}
          {hasIOS && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sm">
              🍎 iOS
            </span>
          )}
          {hasAndroid && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sm">
              🤖 Android
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range filter */}
          <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <TabsList>
              {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((range) => (
                <TabsTrigger key={range} value={range}>
                  {DATE_RANGE_LABELS[range]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Platform filter (only show if both platforms connected) */}
          {hasIOS && hasAndroid && (
            <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="ios">iOS</TabsTrigger>
                <TabsTrigger value="android">Android</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Sync button */}
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

      {/* Error display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Metrics Overview */}
      <MetricsOverview metrics={getFilteredMetrics()} />

      {/* Charts and Reviews Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <RatingDistribution reviews={getFilteredReviews()} />
          </CardContent>
        </Card>

        {/* Last Sync Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connected Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {integration.type === 'app_store_connect' ? '🍎' : '🤖'}
                    </span>
                    <div>
                      <p className="font-medium">{integration.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {integration.type === 'app_store_connect' ? 'App Store Connect' : 'Google Play'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        integration.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}
                    >
                      {integration.status}
                    </span>
                    {integration.lastSyncAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last sync: {new Date(integration.lastSyncAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewsList reviews={getFilteredReviews()} />
        </CardContent>
      </Card>
    </div>
  )
}
