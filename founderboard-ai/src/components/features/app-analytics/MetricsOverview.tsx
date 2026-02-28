'use client'

/**
 * MetricsOverview Component
 *
 * Displays KPI cards for app analytics metrics.
 */

import { Card, CardContent } from '@/components/ui/card'
import type { AppStoreMetrics } from '@/types/integrations'
import {
  getTotalDownloads,
  getTotalRevenue,
  getAverageRating,
  formatRevenue,
} from '@/types/integrations'

interface MetricsOverviewProps {
  metrics: AppStoreMetrics[]
}

export function MetricsOverview({ metrics }: MetricsOverviewProps) {
  // Calculate aggregated values
  const totalDownloads = getTotalDownloads(metrics)
  const totalRevenue = getTotalRevenue(metrics)
  const averageRating = getAverageRating(metrics)
  const totalActiveDevices = metrics.reduce((sum, m) => sum + m.activeDevices, 0)

  // Format large numbers
  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toLocaleString()
  }

  // Render star rating
  function renderStars(rating: number | null): React.ReactNode {
    if (rating === null) return '—'

    const fullStars = Math.floor(rating)
    const hasHalf = rating % 1 >= 0.5
    const stars = []

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="text-yellow-500">
            ★
          </span>
        )
      } else if (i === fullStars && hasHalf) {
        stars.push(
          <span key={i} className="text-yellow-500">
            ★
          </span>
        )
      } else {
        stars.push(
          <span key={i} className="text-muted-foreground/30">
            ★
          </span>
        )
      }
    }

    return <span className="text-lg">{stars}</span>
  }

  const kpiCards = [
    {
      title: 'Total Downloads',
      value: formatNumber(totalDownloads),
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      ),
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
    },
    {
      title: 'Total Revenue',
      value: formatRevenue(totalRevenue),
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
      title: 'Average Rating',
      value: averageRating !== null ? averageRating.toFixed(1) : '—',
      extra: renderStars(averageRating),
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ),
      color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',
    },
    {
      title: 'Active Devices',
      value: formatNumber(totalActiveDevices),
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
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
