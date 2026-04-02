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
import type { MetricSnapshot } from '@/types/metrics'

type DateRange = 30 | 60 | 90

interface ChartDataPoint {
  date: string
  value: number
  fullDate: string
}

export function MRRChart() {
  const [range, setRange] = useState<DateRange>(30)
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const result = await getMetricSnapshots('mrr', range)
        if (result.success) {
          const chartData = result.data.map((snapshot: MetricSnapshot) => {
            // recordedAt is now an ISO string, so we just parse it
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
        console.error('Failed to fetch MRR data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [range])

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value}`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">MRR Trend</CardTitle>
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
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <p className="text-sm">No data yet. Update your MRR to see the trend.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
                width={60}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ChartDataPoint
                    return (
                      <div className="bg-popover border rounded-md shadow-lg p-2">
                        <p className="text-xs text-muted-foreground">{data.fullDate}</p>
                        <p className="text-sm font-medium">
                          ${data.value.toLocaleString()}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
