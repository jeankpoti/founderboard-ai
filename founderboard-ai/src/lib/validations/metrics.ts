import { z } from 'zod'
import type { MetricType } from '@/types/metrics'

export const updateMetricSchema = z.object({
  type: z.enum(['mrr', 'users', 'churn', 'conversions'] as const),
  value: z
    .number()
    .min(0, 'Value must be 0 or greater')
    .max(999999999, 'Value is too large'),
})

export type UpdateMetricInput = z.infer<typeof updateMetricSchema>

export function validateMetricValue(type: MetricType, value: number): string | null {
  if (value < 0) {
    return 'Value must be 0 or greater'
  }

  if (type === 'churn' || type === 'conversions') {
    if (value > 100) {
      return 'Percentage cannot exceed 100%'
    }
  }

  return null
}
