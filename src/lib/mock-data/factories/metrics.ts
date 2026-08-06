/**
 * Mock data factory for dashboard KPI metrics.
 * Generates realistic MRR, users, churn, and conversions data.
 */

import type { Metric, MetricSnapshot, MetricType } from '@/types/metrics'
import { MOCK_ORG_ID, generateId, generateDateRange, randomBetween } from '../utils'

const MOCK_USER_ID = 'mock-user-demo'

/**
 * Base values for each metric type
 */
const METRIC_BASE_VALUES: Record<MetricType, { current: number; previous: number }> = {
  mrr: { current: 48500, previous: 45200 },
  users: { current: 2450, previous: 2280 },
  churn: { current: 2.3, previous: 2.8 },
  conversions: { current: 24, previous: 21 },
}

/**
 * Generate current KPI metrics for the dashboard.
 */
export function generateMetrics(): Metric[] {
  const now = new Date().toISOString()
  const metricTypes: MetricType[] = ['mrr', 'users', 'churn', 'conversions']

  return metricTypes.map((type) => ({
    id: `${MOCK_ORG_ID}_${type}`,
    orgId: MOCK_ORG_ID,
    type,
    value: METRIC_BASE_VALUES[type].current,
    previousValue: METRIC_BASE_VALUES[type].previous,
    updatedAt: now,
    updatedBy: MOCK_USER_ID,
  }))
}

/**
 * Generate historical metric snapshots for trend charts.
 * Creates realistic growth/variation patterns.
 */
export function generateMetricSnapshots(type: MetricType, days: number = 30): MetricSnapshot[] {
  const dates = generateDateRange(days)
  const baseConfig = METRIC_BASE_VALUES[type]

  // Calculate starting value (work backwards from current)
  const growthFactor = type === 'churn' ? 1.02 : 0.98 // Churn should decrease, others increase
  const startValue = baseConfig.current * Math.pow(growthFactor, -days)

  return dates.map((date, index) => {
    let value: number

    switch (type) {
      case 'mrr':
        // MRR grows ~7% monthly with daily variation
        value = startValue * Math.pow(1.002, index) + randomBetween(-500, 500)
        value = Math.round(value)
        break

      case 'users':
        // Users grow steadily with some variation
        value = startValue * Math.pow(1.003, index) + randomBetween(-20, 30)
        value = Math.round(value)
        break

      case 'churn':
        // Churn decreases slightly over time (improvement)
        value = startValue * Math.pow(0.995, index) + randomBetween(-0.2, 0.2)
        value = Math.round(value * 10) / 10 // Round to 1 decimal
        value = Math.max(0.5, Math.min(5, value)) // Keep between 0.5% and 5%
        break

      case 'conversions':
        // Conversions improve with optimization
        value = startValue * Math.pow(1.002, index) + randomBetween(-1, 2)
        value = Math.round(value * 10) / 10 // Round to 1 decimal
        value = Math.max(10, Math.min(40, value)) // Keep between 10% and 40%
        break

      default:
        value = baseConfig.current
    }

    return {
      id: generateId(),
      orgId: MOCK_ORG_ID,
      type,
      value,
      recordedAt: date,
      recordedBy: MOCK_USER_ID,
    }
  })
}
