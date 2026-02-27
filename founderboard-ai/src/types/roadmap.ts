/**
 * Roadmap Types & Schemas
 *
 * This file defines all data structures for the Roadmap feature.
 *
 * WHAT IS A PRODUCT ROADMAP?
 * A roadmap is a visual timeline showing what features/projects
 * you're building and when. It helps:
 * - Communicate plans to stakeholders
 * - Align the team on priorities
 * - Track progress over time
 *
 * KEY CONCEPTS:
 * - Roadmap Item: A feature, project, or initiative on the timeline
 * - Milestone: A significant checkpoint or goal date
 * - Quarter: Time periods (Q1, Q2, Q3, Q4) for organizing work
 */

import { z } from 'zod'

// ========================================
// ROADMAP ITEM TYPES
// ========================================

/**
 * Status of a roadmap item.
 *
 * Items progress through these stages:
 * planned -> in_progress -> completed
 * (or can be cancelled/on_hold)
 */
export type RoadmapItemStatus =
  | 'planned'      // Scheduled but not started
  | 'in_progress'  // Currently being worked on
  | 'completed'    // Done!
  | 'on_hold'      // Paused temporarily
  | 'cancelled'    // Not going to happen

export const ROADMAP_ITEM_STATUSES: RoadmapItemStatus[] = [
  'planned',
  'in_progress',
  'completed',
  'on_hold',
  'cancelled',
]

export const ROADMAP_STATUS_LABELS: Record<RoadmapItemStatus, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
}

export const ROADMAP_STATUS_COLORS: Record<RoadmapItemStatus, string> = {
  planned: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  on_hold: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
}

/**
 * Category/type of roadmap item.
 */
export type RoadmapItemCategory =
  | 'feature'       // New product feature
  | 'improvement'   // Enhancement to existing feature
  | 'infrastructure' // Backend/tech improvements
  | 'bug_fix'       // Fixing issues
  | 'research'      // Research & exploration
  | 'other'         // Anything else

export const ROADMAP_ITEM_CATEGORIES: RoadmapItemCategory[] = [
  'feature',
  'improvement',
  'infrastructure',
  'bug_fix',
  'research',
  'other',
]

export const ROADMAP_CATEGORY_LABELS: Record<RoadmapItemCategory, string> = {
  feature: 'Feature',
  improvement: 'Improvement',
  infrastructure: 'Infrastructure',
  bug_fix: 'Bug Fix',
  research: 'Research',
  other: 'Other',
}

export const ROADMAP_CATEGORY_ICONS: Record<RoadmapItemCategory, string> = {
  feature: '✨',
  improvement: '📈',
  infrastructure: '🔧',
  bug_fix: '🐛',
  research: '🔬',
  other: '📦',
}

export const ROADMAP_CATEGORY_COLORS: Record<RoadmapItemCategory, string> = {
  feature: 'bg-purple-500',
  improvement: 'bg-blue-500',
  infrastructure: 'bg-slate-500',
  bug_fix: 'bg-red-500',
  research: 'bg-amber-500',
  other: 'bg-gray-500',
}

/**
 * Priority levels.
 */
export type RoadmapPriority = 'low' | 'medium' | 'high' | 'critical'

export const ROADMAP_PRIORITIES: RoadmapPriority[] = [
  'low',
  'medium',
  'high',
  'critical',
]

export const ROADMAP_PRIORITY_LABELS: Record<RoadmapPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

// ========================================
// ROADMAP ITEM INTERFACE
// ========================================

/**
 * Represents a single item on the roadmap.
 */
export interface RoadmapItem {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** Item title */
  title: string

  /** Detailed description (supports markdown) */
  description: string

  /** Category/type of item */
  category: RoadmapItemCategory

  /** Current status */
  status: RoadmapItemStatus

  /** Priority level */
  priority: RoadmapPriority

  /**
   * Start date (when work begins).
   * Format: ISO date string (YYYY-MM-DD)
   */
  startDate: string

  /**
   * End date (target completion).
   * Format: ISO date string (YYYY-MM-DD)
   */
  endDate: string

  /** Progress percentage (0-100) */
  progress: number

  /** Assigned team members (user IDs) */
  assignees: string[]

  /** Related milestone ID */
  milestoneId?: string

  /** Tags for filtering */
  tags: string[]

  /** Dependencies - IDs of items that must complete first */
  dependencies: string[]

  /** Who created this item */
  createdBy: string
  createdByName?: string

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

// ========================================
// MILESTONE INTERFACE
// ========================================

/**
 * Represents a milestone on the roadmap.
 *
 * Milestones are significant checkpoints or goals,
 * like "MVP Launch" or "Public Beta".
 */
export interface RoadmapMilestone {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** Milestone name */
  name: string

  /** Description of what this milestone represents */
  description: string

  /**
   * Target date for this milestone.
   * Format: ISO date string (YYYY-MM-DD)
   */
  targetDate: string

  /** Is this milestone achieved? */
  isCompleted: boolean

  /** Actual completion date (if completed) */
  completedAt?: string

  /** Color for visual distinction */
  color: string

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

/**
 * Schema for creating a roadmap item.
 */
export const createRoadmapItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),

  description: z
    .string()
    .max(5000, 'Description is too long')
    .default(''),

  category: z
    .enum(ROADMAP_ITEM_CATEGORIES as [RoadmapItemCategory, ...RoadmapItemCategory[]])
    .default('feature'),

  status: z
    .enum(ROADMAP_ITEM_STATUSES as [RoadmapItemStatus, ...RoadmapItemStatus[]])
    .default('planned'),

  priority: z
    .enum(ROADMAP_PRIORITIES as [RoadmapPriority, ...RoadmapPriority[]])
    .default('medium'),

  startDate: z.string().min(1, 'Start date is required'),

  endDate: z.string().min(1, 'End date is required'),

  progress: z.number().min(0).max(100).default(0),

  assignees: z.array(z.string()).default([]),

  milestoneId: z.string().optional(),

  tags: z.array(z.string()).default([]),

  dependencies: z.array(z.string()).default([]),
})

/**
 * Schema for updating a roadmap item.
 */
export const updateRoadmapItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  category: z.enum(ROADMAP_ITEM_CATEGORIES as [RoadmapItemCategory, ...RoadmapItemCategory[]]).optional(),
  status: z.enum(ROADMAP_ITEM_STATUSES as [RoadmapItemStatus, ...RoadmapItemStatus[]]).optional(),
  priority: z.enum(ROADMAP_PRIORITIES as [RoadmapPriority, ...RoadmapPriority[]]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  assignees: z.array(z.string()).optional(),
  milestoneId: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
})

/**
 * Schema for creating a milestone.
 */
export const createMilestoneSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),

  description: z
    .string()
    .max(500, 'Description is too long')
    .default(''),

  targetDate: z.string().min(1, 'Target date is required'),

  color: z.string().default('#6366f1'), // Default to indigo
})

/**
 * Schema for updating a milestone.
 */
export const updateMilestoneSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  targetDate: z.string().optional(),
  isCompleted: z.boolean().optional(),
  color: z.string().optional(),
})

// ========================================
// TYPE INFERENCE
// ========================================

export type CreateRoadmapItemInput = z.infer<typeof createRoadmapItemSchema>
export type UpdateRoadmapItemInput = z.infer<typeof updateRoadmapItemSchema>
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get the quarter for a given date.
 *
 * @param date - Date string (ISO format)
 * @returns Quarter string like "Q1 2024"
 */
export function getQuarter(date: string): string {
  const d = new Date(date)
  const quarter = Math.ceil((d.getMonth() + 1) / 3)
  return `Q${quarter} ${d.getFullYear()}`
}

/**
 * Get all quarters between two dates.
 *
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Array of quarter strings
 */
export function getQuartersBetween(startDate: string, endDate: string): string[] {
  const quarters: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)

  let current = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1)

  while (current <= end) {
    quarters.push(getQuarter(current.toISOString()))
    current.setMonth(current.getMonth() + 3)
  }

  return quarters
}

/**
 * Calculate the position of an item on a timeline.
 *
 * @param itemStart - Item start date
 * @param itemEnd - Item end date
 * @param timelineStart - Timeline start date
 * @param timelineEnd - Timeline end date
 * @returns Object with left position and width as percentages
 */
export function calculateTimelinePosition(
  itemStart: string,
  itemEnd: string,
  timelineStart: string,
  timelineEnd: string
): { left: number; width: number } {
  const tStart = new Date(timelineStart).getTime()
  const tEnd = new Date(timelineEnd).getTime()
  const iStart = new Date(itemStart).getTime()
  const iEnd = new Date(itemEnd).getTime()

  const totalDuration = tEnd - tStart
  const left = ((Math.max(iStart, tStart) - tStart) / totalDuration) * 100
  const right = ((Math.min(iEnd, tEnd) - tStart) / totalDuration) * 100
  const width = right - left

  return { left: Math.max(0, left), width: Math.max(1, width) }
}

/**
 * Group roadmap items by quarter.
 *
 * @param items - Array of roadmap items
 * @returns Object with quarters as keys and items as values
 */
export function groupItemsByQuarter(
  items: RoadmapItem[]
): Record<string, RoadmapItem[]> {
  const grouped: Record<string, RoadmapItem[]> = {}

  items.forEach((item) => {
    const quarter = getQuarter(item.startDate)
    if (!grouped[quarter]) {
      grouped[quarter] = []
    }
    grouped[quarter].push(item)
  })

  return grouped
}

/**
 * Sort roadmap items by start date.
 *
 * @param items - Array of roadmap items
 * @returns Sorted array
 */
export function sortByStartDate(items: RoadmapItem[]): RoadmapItem[] {
  return [...items].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )
}

/**
 * Calculate overall roadmap progress.
 *
 * @param items - Array of roadmap items
 * @returns Average progress percentage
 */
export function calculateOverallProgress(items: RoadmapItem[]): number {
  if (items.length === 0) return 0
  const total = items.reduce((sum, item) => sum + item.progress, 0)
  return Math.round(total / items.length)
}

/**
 * Get items that are overdue.
 *
 * @param items - Array of roadmap items
 * @returns Items past their end date that aren't completed
 */
export function getOverdueItems(items: RoadmapItem[]): RoadmapItem[] {
  const now = new Date()
  return items.filter(
    (item) =>
      item.status !== 'completed' &&
      item.status !== 'cancelled' &&
      new Date(item.endDate) < now
  )
}
