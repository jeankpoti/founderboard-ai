'use client'

/**
 * RevenueChart Component
 *
 * Displays a line chart of revenue over time.
 */

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { Button } from '@/components/ui/button'
import type { StripeMetrics } from '@/types/integrations'
import { formatRevenue } from '@/types/integrations'

interface RevenueChartProps {
  metrics: StripeMetrics[]
}

type DateRange = '7d' | '30d' | '90d'

export function RevenueChart({ metrics }: RevenueChartProps) {
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [chartType, setChartType] = useState<'revenue' | 'mrr'>('mrr')

  // Filter and prepare data based on date range
  function getFilteredData() {
    const now = new Date()
    const daysBack = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90

    const cutoffDate = new Date(now)
    cutoffDate.setDate(cutoffDate.getDate() - daysBack)

    return metrics
      .filter((m) => new Date(m.period) >= cutoffDate)
      .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime())
      .map((m) => ({
        date: new Date(m.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mrr: m.mrr / 100, // Convert cents to dollars
        revenue: m.revenue / 100,
        subscriptions: m.activeSubscriptions,
      }))
  }

  const chartData = getFilteredData()

  // No data
  if (metrics.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-muted-foreground">No revenue data available</p>
        <p className="text-sm text-muted-foreground">
          Data will appear here once Stripe syncs.
        </p>
      </div>
    )
  }

  // Format tooltip value
  const formatTooltipValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">
          {chartType === 'mrr' ? 'MRR Trend' : 'Revenue Trend'}
        </h3>

        <div className="flex items-center gap-2">
          {/* Chart type toggle */}
          <div className="flex rounded-lg border p-1">
            <Button
              variant={chartType === 'mrr' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('mrr')}
              className="h-7 px-3"
            >
              MRR
            </Button>
            <Button
              variant={chartType === 'revenue' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('revenue')}
              className="h-7 px-3"
            >
              Revenue
            </Button>
          </div>

          {/* Date range */}
          <div className="flex rounded-lg border p-1">
            {(['7d', '30d', '90d'] as DateRange[]).map((range) => (
              <Button
                key={range}
                variant={dateRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDateRange(range)}
                className="h-7 px-3"
              >
                {range}
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
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
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
                          {chartType === 'mrr' ? 'MRR' : 'Revenue'}:{' '}
                          <span className="font-medium text-foreground">
                            {formatTooltipValue(payload[0].value as number)}
                          </span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Area
                type="monotone"
                dataKey={chartType}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorValue)"
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
