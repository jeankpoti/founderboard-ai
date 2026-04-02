'use client'

/**
 * RevenueDashboard Component
 *
 * Main dashboard showing Stripe revenue data.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { RevenueMetrics } from './RevenueMetrics'
import { RevenueChart } from './RevenueChart'
import { ChargesList } from './ChargesList'
import {
  getIntegrations,
  getStripeMetrics,
  getStripeCharges,
  syncIntegration,
} from '@/lib/actions/integrations'
import type { Integration, StripeMetrics, StripeCharge } from '@/types/integrations'
import Link from 'next/link'

export function RevenueDashboard() {
  // State
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [metrics, setMetrics] = useState<StripeMetrics[]>([])
  const [charges, setCharges] = useState<StripeCharge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch data on mount
  useEffect(() => {
    loadData()
  }, [])

  /**
   * Load Stripe integration and data.
   */
  async function loadData() {
    setIsLoading(true)
    setError(null)

    try {
      // Get all integrations
      const intResult = await getIntegrations()
      if (!intResult.success) {
        setError(intResult.error.message)
        return
      }

      // Find Stripe integration
      const stripeIntegration = intResult.data.find((i) => i.type === 'stripe')
      setIntegration(stripeIntegration || null)

      if (stripeIntegration && stripeIntegration.status === 'active') {
        // Fetch metrics
        const metricsResult = await getStripeMetrics(stripeIntegration.id)
        if (metricsResult.success) {
          setMetrics(metricsResult.data)
        }

        // Fetch charges
        const chargesResult = await getStripeCharges(stripeIntegration.id, 20)
        if (chargesResult.success) {
          setCharges(chargesResult.data)
        }
      }
    } catch (err) {
      console.error('Error loading revenue data:', err)
      setError('Failed to load revenue data.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Trigger sync for Stripe integration.
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
      setError('Failed to sync Stripe data.')
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

  // No Stripe integration connected
  if (!integration) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="text-5xl">💳</div>
            <h3 className="text-lg font-semibold">Connect Stripe</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Connect your Stripe account to see MRR, revenue trends, subscriptions, and recent charges.
            </p>
            <Button asChild>
              <Link href="/integrations">Connect Stripe</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with integration status and sync button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💳</span>
          <div>
            <p className="font-medium">{integration.name}</p>
            <p className="text-xs text-muted-foreground">Stripe</p>
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

      {/* Error display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Metrics Overview */}
      <RevenueMetrics metrics={metrics} />

      {/* Revenue Chart */}
      <Card>
        <CardContent className="pt-6">
          <RevenueChart metrics={metrics} />
        </CardContent>
      </Card>

      {/* Recent Charges */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Recent Charges</h3>
          <ChargesList charges={charges} />
        </CardContent>
      </Card>
    </div>
  )
}
