'use client'

/**
 * EventsMetrics Component
 *
 * Displays KPI cards for Mixpanel metrics.
 */

import { Card, CardContent } from '@/components/ui/card'
import type { MixpanelEvent, MixpanelFunnel, MixpanelRetention } from '@/types/integrations'
import { getTotalMixpanelEvents, getAverageRetention } from '@/types/integrations'

interface EventsMetricsProps {
  events: MixpanelEvent[]
  funnels: MixpanelFunnel[]
  retention: MixpanelRetention[]
}

export function EventsMetrics({ events, funnels, retention }: EventsMetricsProps) {
  const totalEvents = getTotalMixpanelEvents(events)
  const uniqueEventTypes = events.length
  const avgConversion = funnels.length > 0
    ? Math.round(funnels.reduce((sum, f) => sum + f.conversionRate, 0) / funnels.length)
    : null
  const day7Retention = getAverageRetention(retention, 'day7')

  const kpiCards = [
    {
      title: 'Total Events',
      value: totalEvents.toLocaleString(),
      subtitle: `${uniqueEventTypes} event types`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
    },
    {
      title: 'Unique Users',
      value: events.length > 0 ? Math.max(...events.map(e => e.uniqueUsers)).toLocaleString() : '0',
      subtitle: 'Active users',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400',
    },
    {
      title: 'Avg Conversion',
      value: avgConversion !== null ? `${avgConversion}%` : '—',
      subtitle: funnels.length > 0 ? `${funnels.length} funnels` : 'No funnels',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      ),
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
    },
    {
      title: 'Day 7 Retention',
      value: day7Retention !== null ? `${day7Retention}%` : '—',
      subtitle: day7Retention !== null ? (day7Retention >= 20 ? 'Good' : 'Needs attention') : 'No data',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: day7Retention !== null && day7Retention >= 20
        ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
        : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
    },
  ]

  if (events.length === 0) {
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
                <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
              </div>
              <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
