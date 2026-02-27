/**
 * OKRs Types & Schemas
 *
 * This file defines all data structures for the OKRs (Objectives and Key Results) feature.
 *
 * WHAT ARE OKRs?
 * - OKR stands for Objectives and Key Results
 * - A goal-setting framework used by companies like Google, Intel
 * - Helps align team efforts and measure progress
 *
 * HOW OKRS WORK:
 * - Objective: WHAT you want to achieve (qualitative, inspiring)
 *   Example: "Become the leading platform for startup founders"
 *
 * - Key Results: HOW you measure success (quantitative, measurable)
 *   Example: "Increase MRR from $50K to $100K"
 *   Example: "Achieve 90% customer satisfaction score"
 *
 * TYPICAL STRUCTURE:
 * - 3-5 Objectives per quarter
 * - 2-5 Key Results per Objective
 * - Progress tracked weekly or bi-weekly
 */

import { z } from 'zod'

// ========================================
// OKR PERIODS
// ========================================

/**
 * Time period for OKRs.
 *
 * Most companies do quarterly OKRs, but annual is also common.
 */
export type OKRPeriod = 'q1' | 'q2' | 'q3' | 'q4' | 'annual'

export const OKR_PERIODS: OKRPeriod[] = ['q1', 'q2', 'q3', 'q4', 'annual']

export const OKR_PERIOD_LABELS: Record<OKRPeriod, string> = {
  q1: 'Q1 (Jan-Mar)',
  q2: 'Q2 (Apr-Jun)',
  q3: 'Q3 (Jul-Sep)',
  q4: 'Q4 (Oct-Dec)',
  annual: 'Annual',
}

// ========================================
// OKR STATUS
// ========================================

/**
 * Status of an Objective or Key Result.
 *
 * - draft: Still being defined
 * - active: Currently being worked on
 * - completed: Achieved the goal
 * - cancelled: No longer relevant
 */
export type OKRStatus = 'draft' | 'active' | 'completed' | 'cancelled'

export const OKR_STATUSES: OKRStatus[] = ['draft', 'active', 'completed', 'cancelled']

export const OKR_STATUS_LABELS: Record<OKRStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const OKR_STATUS_COLORS: Record<OKRStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

// ========================================
// KEY RESULT METRIC TYPES
// ========================================

/**
 * Type of metric for a Key Result.
 *
 * This determines how we measure progress:
 * - number: Simple count (e.g., "Get 100 new users")
 * - percent: Percentage (e.g., "Increase conversion by 20%")
 * - currency: Money (e.g., "Reach $100K MRR")
 * - boolean: Yes/No (e.g., "Launch new feature")
 */
export type MetricType = 'number' | 'percent' | 'currency' | 'boolean'

export const METRIC_TYPES: MetricType[] = ['number', 'percent', 'currency', 'boolean']

export const METRIC_TYPE_LABELS: Record<MetricType, string> = {
  number: 'Number',
  percent: 'Percentage',
  currency: 'Currency',
  boolean: 'Yes/No',
}

// ========================================
// OBJECTIVE INTERFACE
// ========================================

/**
 * Represents an Objective.
 *
 * An Objective is the "what" - a qualitative goal you want to achieve.
 * It should be inspiring and ambitious.
 *
 * Example Objectives:
 * - "Delight our customers with world-class support"
 * - "Build a product that founders love"
 * - "Establish ourselves as thought leaders in the space"
 */
export interface Objective {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** The objective title (what you want to achieve) */
  title: string

  /** Optional description with more context */
  description?: string

  /** Which period this objective is for */
  period: OKRPeriod

  /** Which year */
  year: number

  /** Who owns this objective (user ID) */
  ownerId?: string

  /** Owner's display name (for quick display) */
  ownerName?: string

  /** Current status */
  status: OKRStatus

  /**
   * Overall progress (0-100)
   *
   * This is calculated from the Key Results.
   * If you have 3 KRs at 50%, 100%, and 25%, the average is ~58%.
   */
  progress: number

  /** Order for display (allows drag-and-drop sorting) */
  order: number

  /** Who created this */
  createdBy: string

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

// ========================================
// KEY RESULT INTERFACE
// ========================================

/**
 * Represents a Key Result.
 *
 * A Key Result is the "how" - a measurable outcome that shows progress.
 * It should be specific and quantifiable.
 *
 * Example Key Results:
 * - "Increase NPS from 30 to 50" (number)
 * - "Achieve 95% customer satisfaction" (percent)
 * - "Grow MRR from $50K to $100K" (currency)
 * - "Launch mobile app" (boolean)
 */
export interface KeyResult {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** Which objective this Key Result belongs to */
  objectiveId: string

  /** The key result title */
  title: string

  /** Optional description */
  description?: string

  /** How we measure this KR */
  metricType: MetricType

  /**
   * Starting value
   *
   * Where were you when you started?
   * Example: If growing from $50K to $100K MRR, start is 50000.
   */
  startValue: number

  /**
   * Target value
   *
   * What are you trying to reach?
   * Example: If growing to $100K MRR, target is 100000.
   */
  targetValue: number

  /**
   * Current value
   *
   * Where are you now?
   * This gets updated during check-ins.
   */
  currentValue: number

  /**
   * Progress percentage (0-100)
   *
   * Calculated as: (current - start) / (target - start) * 100
   * For boolean: 0 or 100
   */
  progress: number

  /** Currency code (for currency metrics) */
  currency?: string

  /** Who owns this KR (might be different from objective owner) */
  ownerId?: string
  ownerName?: string

  /** Current status */
  status: OKRStatus

  /** Order for display */
  order: number

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

// ========================================
// CHECK-IN INTERFACE
// ========================================

/**
 * Represents a check-in (progress update) for a Key Result.
 *
 * Check-ins are how you track progress over time.
 * They create a history of updates you can look back on.
 */
export interface KeyResultCheckIn {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** Which Key Result this check-in is for */
  keyResultId: string

  /** The new value after this check-in */
  value: number

  /** Previous value (for comparison) */
  previousValue: number

  /** Notes about this update */
  notes?: string

  /** Who made this check-in */
  createdBy: string
  createdByName?: string

  /** When this check-in was made */
  createdAt: string
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

/**
 * Schema for creating an Objective.
 */
export const createObjectiveSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or less'),

  description: z.string().max(2000).optional(),

  period: z.enum(OKR_PERIODS as [OKRPeriod, ...OKRPeriod[]]),

  year: z.number().min(2020).max(2100),

  ownerId: z.string().optional(),

  status: z
    .enum(OKR_STATUSES as [OKRStatus, ...OKRStatus[]])
    .default('draft'),
})

export const updateObjectiveSchema = createObjectiveSchema.partial()

/**
 * Schema for creating a Key Result.
 */
export const createKeyResultSchema = z.object({
  objectiveId: z.string().min(1, 'Objective is required'),

  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or less'),

  description: z.string().max(2000).optional(),

  metricType: z.enum(METRIC_TYPES as [MetricType, ...MetricType[]]),

  startValue: z.number(),

  targetValue: z.number(),

  currentValue: z.number().default(0),

  currency: z.string().optional(),

  ownerId: z.string().optional(),

  status: z
    .enum(OKR_STATUSES as [OKRStatus, ...OKRStatus[]])
    .default('active'),
})

export const updateKeyResultSchema = createKeyResultSchema.partial()

/**
 * Schema for creating a check-in.
 */
export const createCheckInSchema = z.object({
  keyResultId: z.string().min(1, 'Key Result is required'),

  value: z.number(),

  notes: z.string().max(5000).optional(),
})

// ========================================
// TYPE INFERENCE
// ========================================

export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>
export type UpdateObjectiveInput = z.infer<typeof updateObjectiveSchema>
export type CreateKeyResultInput = z.infer<typeof createKeyResultSchema>
export type UpdateKeyResultInput = z.infer<typeof updateKeyResultSchema>
export type CreateCheckInInput = z.infer<typeof createCheckInSchema>

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Calculate progress for a Key Result.
 *
 * @param current - Current value
 * @param start - Starting value
 * @param target - Target value
 * @param metricType - Type of metric
 * @returns Progress percentage (0-100)
 */
export function calculateKeyResultProgress(
  current: number,
  start: number,
  target: number,
  metricType: MetricType
): number {
  // Boolean metrics are either 0% or 100%
  if (metricType === 'boolean') {
    return current >= 1 ? 100 : 0
  }

  // Avoid division by zero
  if (target === start) {
    return current >= target ? 100 : 0
  }

  // Calculate progress
  const progress = ((current - start) / (target - start)) * 100

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(progress)))
}

/**
 * Calculate overall progress for an Objective.
 *
 * @param keyResults - Array of Key Results for this objective
 * @returns Average progress percentage (0-100)
 */
export function calculateObjectiveProgress(keyResults: KeyResult[]): number {
  if (keyResults.length === 0) return 0

  const totalProgress = keyResults.reduce((sum, kr) => sum + kr.progress, 0)
  return Math.round(totalProgress / keyResults.length)
}

/**
 * Get progress color based on percentage.
 *
 * OKRs typically use a "stretch goal" approach where 70% is considered success.
 */
export function getProgressColor(progress: number): string {
  if (progress >= 70) return 'text-green-600'
  if (progress >= 40) return 'text-amber-600'
  return 'text-red-600'
}

/**
 * Get progress bar color class.
 */
export function getProgressBarColor(progress: number): string {
  if (progress >= 70) return 'bg-green-500'
  if (progress >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

/**
 * Format metric value for display.
 *
 * @param value - The value to format
 * @param metricType - Type of metric
 * @param currency - Currency code (for currency metrics)
 */
export function formatMetricValue(
  value: number,
  metricType: MetricType,
  currency = 'USD'
): string {
  switch (metricType) {
    case 'boolean':
      return value >= 1 ? 'Yes' : 'No'
    case 'percent':
      return `${value}%`
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(value)
    case 'number':
    default:
      return value.toLocaleString()
  }
}

/**
 * Get current quarter.
 *
 * @returns Current quarter as OKRPeriod
 */
export function getCurrentQuarter(): OKRPeriod {
  const month = new Date().getMonth()
  if (month < 3) return 'q1'
  if (month < 6) return 'q2'
  if (month < 9) return 'q3'
  return 'q4'
}

/**
 * Get current year.
 */
export function getCurrentYear(): number {
  return new Date().getFullYear()
}

/**
 * Group objectives by status.
 */
export function groupObjectivesByStatus(
  objectives: Objective[]
): Record<OKRStatus, Objective[]> {
  const grouped: Record<OKRStatus, Objective[]> = {
    draft: [],
    active: [],
    completed: [],
    cancelled: [],
  }

  objectives.forEach((obj) => {
    grouped[obj.status].push(obj)
  })

  return grouped
}
