'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getMetricSnapshots } from '@/lib/actions/metrics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { MetricSnapshot, MetricType } from '@/types/metrics'

type DateRange = 30 | 60 | 90

interface ChartDataPoint {
  date: string
  fullDate: string
  value: number
}

const METRIC_CONFIG: Record<MetricType, { color: string; label: string; format: (v: number) => string }> = {
  mrr: {
    color: '#10b981',
    label: 'MRR',
    format: (v) => {
      if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`
      if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`
      return `$${v.toLocaleString()}`
    },
  },
  users: {
    color: '#3b82f6',
    label: 'Active Users',
    format: (v) => v.toLocaleString(),
  },
  churn: {
    color: '#ef4444',
    label: 'Churn Rate',
    format: (v) => `${v.toFixed(1)}%`,
  },
  conversions: {
    color: '#8b5cf6',
    label: 'Conversions',
    format: (v) => v.toLocaleString(),
  },
}

interface SingleMetricChartProps {
  type: MetricType
  range: DateRange
}

function SingleMetricChart({ type, range }: SingleMetricChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const config = METRIC_CONFIG[type]

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const result = await getMetricSnapshots(type, range)
        if (result.success) {
          const chartData = result.data.map((snapshot: MetricSnapshot) => {
            const date = new Date(snapshot.recordedAt)
            return {
              date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              fullDate: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
              value: snapshot.value,
            }
          })
          setData(chartData)
        }
      } catch (error) {
        console.error(`Failed to fetch ${type} data:`, error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [type, range])

  if (isLoading) {
    return <Skeleton className="h-[150px] w-full" />
  }

  if (data.length === 0) {
    return (
      <div className="h-[150px] flex items-center justify-center text-muted-foreground">
        <p className="text-sm">No data yet</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          tickFormatter={(v) => config.format(v)}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
          width={50}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const point = payload[0].payload as ChartDataPoint
              return (
                <div className="bg-popover border rounded-md shadow-lg p-2">
                  <p className="text-xs text-muted-foreground">{point.fullDate}</p>
                  <p className="text-sm font-medium">{config.format(point.value)}</p>
                </div>
              )
            }
            return null
          }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={config.color}
          strokeWidth={2}
          dot={{ fill: config.color, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: config.color }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function MetricTrendChart() {
  const [range, setRange] = useState<DateRange>(30)

  const metricTypes: MetricType[] = ['mrr', 'users', 'churn', 'conversions']

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Metrics Trend</CardTitle>
        <div className="flex gap-1">
          {([30, 60, 90] as DateRange[]).map((days) => (
            <Button
              key={days}
              variant={range === days ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setRange(days)}
            >
              {days}D
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {metricTypes.map((type) => (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: METRIC_CONFIG[type].color }}
              />
              <span className="text-sm font-medium">{METRIC_CONFIG[type].label}</span>
            </div>
            <SingleMetricChart type={type} range={range} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
