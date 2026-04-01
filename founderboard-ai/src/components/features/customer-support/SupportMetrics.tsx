'use client'

/**
 * SupportMetrics Component
 *
 * Displays KPI cards for Intercom metrics.
 */

import { Card, CardContent } from '@/components/ui/card'
import type { IntercomMetrics, IntercomConversation } from '@/types/integrations'

interface SupportMetricsProps {
  metrics: IntercomMetrics | null
  conversations: IntercomConversation[]
}

export function SupportMetrics({ metrics, conversations }: SupportMetricsProps) {
  const openCount = conversations.filter(c => c.status === 'open').length
  const pendingCount = conversations.filter(c => c.status === 'pending').length
  const resolvedCount = conversations.filter(c => c.status === 'resolved' || c.status === 'closed').length

  const kpiCards = [
    {
      title: 'Total Conversations',
      value: metrics?.totalConversations?.toLocaleString() ?? conversations.length.toString(),
      subtitle: `${openCount} open, ${pendingCount} pending`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
    },
    {
      title: 'Avg First Response',
      value: metrics?.avgFirstResponseTime
        ? formatTime(metrics.avgFirstResponseTime)
        : '—',
      subtitle: metrics?.avgFirstResponseTime && metrics.avgFirstResponseTime <= 60 ? 'Great' : 'Needs improvement',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: metrics?.avgFirstResponseTime && metrics.avgFirstResponseTime <= 60
        ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
        : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
    },
    {
      title: 'Avg Resolution Time',
      value: metrics?.avgResolutionTime
        ? formatTime(metrics.avgResolutionTime)
        : '—',
      subtitle: `${resolvedCount} resolved`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
    },
    {
      title: 'Satisfaction Score',
      value: metrics?.satisfactionScore !== undefined ? `${metrics.satisfactionScore}%` : '—',
      subtitle: metrics?.satisfactionScore !== undefined
        ? (metrics.satisfactionScore >= 80 ? 'Excellent' : metrics.satisfactionScore >= 60 ? 'Good' : 'Needs work')
        : 'No ratings yet',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: metrics?.satisfactionScore !== undefined && metrics.satisfactionScore >= 80
        ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
        : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
    },
  ]

  const hasData = metrics || conversations.length > 0

  if (!hasData) {
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

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
}
