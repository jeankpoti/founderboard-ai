'use client'

/**
 * TrafficChart Component
 *
 * Displays an area chart of sessions and users over time.
 */

import { useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Button } from '@/components/ui/button'
import type { GoogleAnalyticsMetrics } from '@/types/integrations'

interface TrafficChartProps {
  metrics: GoogleAnalyticsMetrics[]
  dateRange: '7d' | '30d' | '90d' | 'all'
  onDateRangeChange: (range: '7d' | '30d' | '90d' | 'all') => void
}

type ChartMetric = 'sessions' | 'users' | 'pageviews'

export function TrafficChart({
  metrics,
  dateRange,
  onDateRangeChange,
}: TrafficChartProps) {
  const [chartMetric, setChartMetric] = useState<ChartMetric>('sessions')

  function formatAxisDate(dateStr: string): string {
    const date = new Date(dateStr)

    if (dateRange === 'all') {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const chartData = [...metrics]
    .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())
    .map((m) => ({
      period: m.period,
      date: formatAxisDate(m.period),
      sessions: m.sessions,
      users: m.users,
      pageviews: m.pageviews,
    }))

  // No data
  if (metrics.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">{"</>"}</div>
        <p className="text-muted-foreground">No traffic data available</p>
        <p className="text-sm text-muted-foreground">
          Data will appear here once Google Analytics syncs.
        </p>
      </div>
    )
  }

  // Format number for display
  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
    return value.toString()
  }

  const metricLabels: Record<ChartMetric, string> = {
    sessions: 'Sessions',
    users: 'Users',
    pageviews: 'Pageviews',
  }

  const metricColors: Record<ChartMetric, string> = {
    sessions: 'hsl(var(--primary))',
    users: '#22c55e',
    pageviews: '#a855f7',
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">
          Traffic Trend
        </h3>

        <div className="flex items-center gap-2">
          {/* Metric toggle */}
          <div className="flex rounded-lg border p-1">
            {(['sessions', 'users', 'pageviews'] as ChartMetric[]).map((metric) => (
              <Button
                key={metric}
                variant={chartMetric === metric ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartMetric(metric)}
                className="h-7 px-3"
              >
                {metricLabels[metric]}
              </Button>
            ))}
          </div>

          {/* Date range */}
          <div className="flex rounded-lg border p-1">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onDateRangeChange(range)}
                className="h-7 px-3"
              >
                {range === 'all' ? 'All Time' : range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricColors[chartMetric]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={metricColors[chartMetric]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                minTickGap={dateRange === 'all' ? 40 : dateRange === '90d' ? 28 : 16}
                interval="preserveStartEnd"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={formatNumber}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">
                          {metricLabels[chartMetric]}:{' '}
                          <span className="font-medium text-foreground">
                            {(payload[0].value as number).toLocaleString()}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date((payload[0].payload as { period: string }).period).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey={chartMetric}
                stroke={metricColors[chartMetric]}
                strokeWidth={2}
                fill="url(#colorTraffic)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-72 flex items-center justify-center text-muted-foreground">
          No data for selected period
        </div>
      )}
    </div>
  )
}
