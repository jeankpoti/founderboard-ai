'use client'

/**
 * TrafficMetrics Component
 *
 * Displays KPI cards for Google Analytics metrics.
 */

import { Card, CardContent } from '@/components/ui/card'
import type { GoogleAnalyticsMetrics } from '@/types/integrations'
import {
  getTotalSessions,
  getTotalUsers,
  getTotalPageviews,
  getAverageBounceRate,
  getAverageSessionDuration,
  formatSessionDuration,
} from '@/types/integrations'

interface TrafficMetricsProps {
  metrics: GoogleAnalyticsMetrics[]
}

export function TrafficMetrics({ metrics }: TrafficMetricsProps) {
  // Calculate values
  const totalSessions = getTotalSessions(metrics)
  const totalUsers = getTotalUsers(metrics)
  const totalPageviews = getTotalPageviews(metrics)
  const bounceRate = getAverageBounceRate(metrics)
  const avgDuration = getAverageSessionDuration(metrics)

  // Calculate change from previous period (compare first half vs second half)
  function calculateChange(getValue: (m: GoogleAnalyticsMetrics[]) => number): number | null {
    if (metrics.length < 2) return null
    const midpoint = Math.floor(metrics.length / 2)
    const recent = metrics.slice(0, midpoint)
    const previous = metrics.slice(midpoint)
    const recentValue = getValue(recent)
    const previousValue = getValue(previous)
    if (previousValue === 0) return null
    return ((recentValue - previousValue) / previousValue) * 100
  }

  const sessionsChange = calculateChange(getTotalSessions)
  const usersChange = calculateChange(getTotalUsers)
  const pageviewsChange = calculateChange(getTotalPageviews)

  const kpiCards = [
    {
      title: 'Sessions',
      value: totalSessions.toLocaleString(),
      change: sessionsChange,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      ),
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
    },
    {
      title: 'Users',
      value: totalUsers.toLocaleString(),
      change: usersChange,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
    },
    {
      title: 'Pageviews',
      value: totalPageviews.toLocaleString(),
      change: pageviewsChange,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
    },
    {
      title: 'Bounce Rate',
      value: bounceRate !== null ? `${bounceRate}%` : '—',
      subtitle: bounceRate !== null ? (bounceRate < 50 ? 'Good' : bounceRate < 70 ? 'Average' : 'Needs attention') : 'No data',
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
      color: bounceRate !== null && bounceRate < 50
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
    <div className="space-y-4">
      {/* Main KPIs */}
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
                </div>
                <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary metrics */}
      {avgDuration !== null && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Avg. Session Duration: <strong className="text-foreground">{formatSessionDuration(avgDuration)}</strong>
          </span>
          {metrics.length > 0 && (
            <span>
              Pages/Session: <strong className="text-foreground">{(totalPageviews / totalSessions).toFixed(1)}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
