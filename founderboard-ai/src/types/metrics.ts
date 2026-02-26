export type MetricType = 'mrr' | 'users' | 'churn' | 'conversions'

export interface Metric {
  id: string
  orgId: string
  type: MetricType
  value: number
  previousValue: number | null
  updatedAt: string // ISO string for serialization
  updatedBy: string
}

export interface MetricSnapshot {
  id: string
  orgId: string
  type: MetricType
  value: number
  recordedAt: string // ISO string for serialization
  recordedBy: string
}

export type TrendDirection = 'up' | 'down' | 'stable'

export interface MetricDisplay {
  type: MetricType
  label: string
  value: number | null
  previousValue: number | null
  trend: TrendDirection
  changePercent: number | null
  format: 'currency' | 'number' | 'percent'
  description: string
  goodThreshold?: { min?: number; max?: number }
}

export const METRIC_CONFIG: Record<MetricType, {
  label: string
  format: 'currency' | 'number' | 'percent'
  description: string
  goodThreshold?: { min?: number; max?: number }
}> = {
  mrr: {
    label: 'Monthly Recurring Revenue',
    format: 'currency',
    description: 'Your predictable monthly revenue from subscriptions.',
  },
  users: {
    label: 'Active Users',
    format: 'number',
    description: 'Users who engaged with your product this month.',
  },
  churn: {
    label: 'Churn Rate',
    format: 'percent',
    description: 'Percentage of customers who cancelled this month.',
    goodThreshold: { max: 3 },
  },
  conversions: {
    label: 'Trial Conversions',
    format: 'percent',
    description: 'Percentage of trials that converted to paid.',
    goodThreshold: { min: 20 },
  },
}

export function calculateTrend(current: number | null, previous: number | null): {
  direction: TrendDirection
  changePercent: number | null
} {
  if (current === null || previous === null || previous === 0) {
    return { direction: 'stable', changePercent: null }
  }

  const change = ((current - previous) / previous) * 100

  if (Math.abs(change) < 1) {
    return { direction: 'stable', changePercent: change }
  }

  return {
    direction: change > 0 ? 'up' : 'down',
    changePercent: change,
  }
}

export function formatMetricValue(value: number | null, format: 'currency' | 'number' | 'percent'): string {
  if (value === null) return '--'

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'number':
      return new Intl.NumberFormat('en-US').format(value)
  }
}
