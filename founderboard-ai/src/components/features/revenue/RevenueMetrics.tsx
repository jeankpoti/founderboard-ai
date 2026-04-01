'use client'

/**
 * RevenueMetrics Component
 *
 * Displays KPI cards for Stripe revenue metrics.
 */

import { Card, CardContent } from '@/components/ui/card'
import type { StripeMetrics } from '@/types/integrations'
import {
  getLatestMRR,
  getStripeTotalRevenue,
  getActiveSubscriptions,
  calculateChurnRate,
  getNetSubscriptionGrowth,
  formatRevenue,
} from '@/types/integrations'

interface RevenueMetricsProps {
  metrics: StripeMetrics[]
}

export function RevenueMetrics({ metrics }: RevenueMetricsProps) {
  // Calculate values
  const mrr = getLatestMRR(metrics)
  const totalRevenue = getStripeTotalRevenue(metrics)
  const activeSubscriptions = getActiveSubscriptions(metrics)
  const churnRate = calculateChurnRate(metrics)
  const netGrowth = getNetSubscriptionGrowth(metrics)

  // Calculate MRR change from previous period
  const mrrChange = metrics.length >= 2
    ? ((metrics[0].mrr - metrics[1].mrr) / metrics[1].mrr) * 100
    : null

  const kpiCards = [
    {
      title: 'MRR',
      value: formatRevenue(mrr),
      change: mrrChange,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
    },
    {
      title: 'Total Revenue',
      value: formatRevenue(totalRevenue),
      subtitle: 'All time',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
    },
    {
      title: 'Active Subscriptions',
      value: activeSubscriptions.toLocaleString(),
      extra: netGrowth !== 0 ? (
        <span className={`text-xs ${netGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {netGrowth > 0 ? '+' : ''}{netGrowth} this period
        </span>
      ) : null,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
    },
    {
      title: 'Churn Rate',
      value: churnRate !== null ? `${churnRate}%` : '—',
      subtitle: churnRate !== null && churnRate < 5 ? 'Healthy' : churnRate !== null ? 'Needs attention' : 'No data',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
          />
        </svg>
      ),
      color: churnRate !== null && churnRate < 5
        ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
        : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
    },
  ]

  // No data state
  if (metrics.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1 text-muted-foreground/50">—</p>
                  <p className="text-xs text-muted-foreground mt-1">No data yet</p>
                </div>
                <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiCards.map((card) => (
        <Card key={card.title} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
                {card.change !== undefined && card.change !== null && (
                  <p className={`text-xs mt-1 ${card.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {card.change >= 0 ? '↑' : '↓'} {Math.abs(card.change).toFixed(1)}% from last period
                  </p>
                )}
                {card.subtitle && !card.change && (
                  <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                )}
                {card.extra && <div className="mt-1">{card.extra}</div>}
              </div>
              <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
