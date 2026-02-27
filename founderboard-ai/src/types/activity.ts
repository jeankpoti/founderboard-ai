/**
 * Activity Types & Schemas
 *
 * This file defines the data structure for the Activity Feed feature.
 *
 * WHAT IS AN ACTIVITY?
 * - An activity is a record of something that happened in your organization
 * - Examples: "John created a task", "Sarah updated the MRR metric"
 * - It's like a timeline or news feed of what your team is doing
 *
 * WHY TRACK ACTIVITIES?
 * - Keeps everyone in the loop about what's happening
 * - Creates an audit trail (who did what and when)
 * - Helps with team collaboration and transparency
 */

import { z } from 'zod'

// ========================================
// ACTIVITY TYPES
// ========================================

/**
 * All the different types of activities we track.
 *
 * TYPE ALIASES IN TYPESCRIPT:
 * - The "type" keyword creates a custom type
 * - The "|" symbol means "or" - so this value can be ANY of these strings
 * - This is called a "union type"
 *
 * Example: If activity.type is 'task_created', we know a task was created
 */
export type ActivityType =
  // Task-related activities
  | 'task_created' // Someone created a new task
  | 'task_updated' // Someone edited a task
  | 'task_completed' // Someone marked a task as done
  | 'task_deleted' // Someone deleted a task
  | 'task_assigned' // Someone was assigned to a task
  // Metric-related activities
  | 'metric_updated' // Someone updated a KPI (like MRR)
  // Team-related activities
  | 'member_joined' // Someone joined the organization
  | 'member_left' // Someone left the organization
  | 'member_invited' // Someone was invited to join
  | 'member_role_changed' // Someone's role was changed (e.g., member -> admin)
  // Investor-related activities
  | 'investor_added' // New investor contact added
  | 'investor_updated' // Investor info updated
  | 'investor_stage_changed' // Investor moved to different pipeline stage
  | 'meeting_scheduled' // Meeting scheduled with investor
  | 'meeting_completed' // Meeting with investor completed
  // Fundraising activities
  | 'round_created' // New fundraising round started
  | 'round_updated' // Round details updated
  | 'term_sheet_received' // Term sheet received from investor
  // OKR activities
  | 'objective_created' // New OKR objective created
  | 'objective_updated' // Objective updated
  | 'key_result_updated' // Key result progress updated
  | 'key_result_completed' // Key result achieved
  // Document activities
  | 'document_uploaded' // New document uploaded
  | 'document_shared' // Document shared with someone
  // Note activities
  | 'note_created' // New note created
  | 'note_updated' // Note edited
  // Roadmap activities
  | 'roadmap_item_created' // New roadmap item added
  | 'roadmap_item_updated' // Roadmap item updated
  | 'milestone_reached' // Roadmap milestone achieved
  // Integration activities
  | 'integration_connected' // New integration connected
  | 'integration_disconnected' // Integration disconnected

/**
 * Array of all activity types - useful for dropdowns, filters, etc.
 *
 * NOTE: We define this separately from the type above because:
 * - TypeScript "types" only exist at compile time (they're erased in JavaScript)
 * - Arrays exist at runtime, so we can use them in our code
 */
export const ACTIVITY_TYPES: ActivityType[] = [
  'task_created',
  'task_updated',
  'task_completed',
  'task_deleted',
  'task_assigned',
  'metric_updated',
  'member_joined',
  'member_left',
  'member_invited',
  'member_role_changed',
  'investor_added',
  'investor_updated',
  'investor_stage_changed',
  'meeting_scheduled',
  'meeting_completed',
  'round_created',
  'round_updated',
  'term_sheet_received',
  'objective_created',
  'objective_updated',
  'key_result_updated',
  'key_result_completed',
  'document_uploaded',
  'document_shared',
  'note_created',
  'note_updated',
  'roadmap_item_created',
  'roadmap_item_updated',
  'milestone_reached',
  'integration_connected',
  'integration_disconnected',
]

/**
 * What kind of thing was affected by this activity?
 * This helps us link to the right page when someone clicks on the activity.
 */
export type ActivityTargetType =
  | 'task'
  | 'metric'
  | 'member'
  | 'investor'
  | 'meeting'
  | 'round'
  | 'term_sheet'
  | 'objective'
  | 'key_result'
  | 'document'
  | 'note'
  | 'roadmap_item'
  | 'milestone'
  | 'integration'

// ========================================
// ACTIVITY INTERFACE
// ========================================

/**
 * The Activity interface defines the shape of an activity document.
 *
 * WHAT IS AN INTERFACE?
 * - An interface is like a blueprint or contract
 * - It says "any object of this type MUST have these properties"
 * - TypeScript will show errors if you're missing required fields
 *
 * Example activity:
 * {
 *   id: "abc123",
 *   orgId: "org456",
 *   type: "task_created",
 *   actorId: "user789",
 *   actorName: "John Doe",
 *   actorEmail: "john@example.com",
 *   targetType: "task",
 *   targetId: "task123",
 *   targetName: "Fix login bug",
 *   metadata: { status: "todo" },
 *   createdAt: "2024-01-15T10:30:00.000Z"
 * }
 */
export interface Activity {
  /** Unique identifier for this activity (auto-generated by Firestore) */
  id: string

  /** Which organization this activity belongs to (for multi-tenant isolation) */
  orgId: string

  /** What type of activity this is (see ActivityType above) */
  type: ActivityType

  /** The user ID of who performed this action */
  actorId: string

  /** The name of who performed this action (stored for quick display) */
  actorName: string

  /** The email of who performed this action */
  actorEmail: string

  /** What type of thing was affected (task, metric, etc.) */
  targetType: ActivityTargetType

  /** The ID of the affected item (so we can link to it) */
  targetId: string

  /** The name/title of the affected item (for display) */
  targetName: string

  /**
   * Additional details about the activity.
   *
   * WHAT IS Record<string, unknown>?
   * - "Record" is a TypeScript utility type for objects
   * - <string, unknown> means: keys are strings, values can be anything
   * - We use "unknown" instead of "any" because it's safer
   *
   * Example metadata for task_completed:
   * { previousStatus: "in_progress", newStatus: "done" }
   */
  metadata?: Record<string, unknown>

  /** When this activity happened (ISO date string) */
  createdAt: string
}

// ========================================
// HUMAN-READABLE LABELS
// ========================================

/**
 * Human-readable messages for each activity type.
 *
 * These use placeholders that get replaced with actual values:
 * - {actor} = the person who did the action
 * - {target} = the thing that was affected
 *
 * Example: "John created task Fix login bug"
 */
export const ACTIVITY_MESSAGES: Record<ActivityType, string> = {
  task_created: '{actor} created task {target}',
  task_updated: '{actor} updated task {target}',
  task_completed: '{actor} completed task {target}',
  task_deleted: '{actor} deleted task {target}',
  task_assigned: '{actor} assigned task {target}',
  metric_updated: '{actor} updated metric {target}',
  member_joined: '{actor} joined the organization',
  member_left: '{actor} left the organization',
  member_invited: '{actor} invited {target} to the organization',
  member_role_changed: "{actor} changed {target}'s role",
  investor_added: '{actor} added investor {target}',
  investor_updated: '{actor} updated investor {target}',
  investor_stage_changed: '{actor} moved {target} to a new stage',
  meeting_scheduled: '{actor} scheduled meeting {target}',
  meeting_completed: '{actor} completed meeting with {target}',
  round_created: '{actor} created fundraising round {target}',
  round_updated: '{actor} updated round {target}',
  term_sheet_received: '{actor} received term sheet from {target}',
  objective_created: '{actor} created objective {target}',
  objective_updated: '{actor} updated objective {target}',
  key_result_updated: '{actor} updated key result {target}',
  key_result_completed: '{actor} completed key result {target}',
  document_uploaded: '{actor} uploaded {target}',
  document_shared: '{actor} shared {target}',
  note_created: '{actor} created note {target}',
  note_updated: '{actor} updated note {target}',
  roadmap_item_created: '{actor} added {target} to roadmap',
  roadmap_item_updated: '{actor} updated roadmap item {target}',
  milestone_reached: '{actor} reached milestone {target}',
  integration_connected: '{actor} connected {target}',
  integration_disconnected: '{actor} disconnected {target}',
}

/**
 * Icons for each activity type (using emoji for simplicity).
 * These appear next to activities in the feed.
 */
export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  task_created: '📝',
  task_updated: '✏️',
  task_completed: '✅',
  task_deleted: '🗑️',
  task_assigned: '👤',
  metric_updated: '📊',
  member_joined: '👋',
  member_left: '👋',
  member_invited: '📧',
  member_role_changed: '🔑',
  investor_added: '💼',
  investor_updated: '✏️',
  investor_stage_changed: '📈',
  meeting_scheduled: '📅',
  meeting_completed: '🤝',
  round_created: '🚀',
  round_updated: '✏️',
  term_sheet_received: '📄',
  objective_created: '🎯',
  objective_updated: '✏️',
  key_result_updated: '📈',
  key_result_completed: '🏆',
  document_uploaded: '📁',
  document_shared: '🔗',
  note_created: '📝',
  note_updated: '✏️',
  roadmap_item_created: '🗺️',
  roadmap_item_updated: '✏️',
  milestone_reached: '🏁',
  integration_connected: '🔌',
  integration_disconnected: '🔌',
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

/**
 * Zod schema for creating a new activity.
 *
 * WHAT IS ZOD?
 * - Zod is a library for validating data
 * - It checks that data has the right shape before we save it
 * - If validation fails, we get helpful error messages
 *
 * WHY VALIDATE?
 * - Prevents bad data from getting into the database
 * - Gives users helpful error messages
 * - Catches bugs early
 */
export const createActivitySchema = z.object({
  // The type must be one of our defined activity types
  type: z.enum(ACTIVITY_TYPES as [ActivityType, ...ActivityType[]]),

  // targetType is a string (we could make this stricter too)
  targetType: z.string().min(1, 'Target type is required'),

  // targetId is the ID of the affected item
  targetId: z.string().min(1, 'Target ID is required'),

  // targetName is for display purposes
  targetName: z.string().min(1, 'Target name is required').max(500),

  // metadata is optional additional info
  // z.record(keyType, valueType) creates a Record<string, unknown>
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * TypeScript type inferred from the Zod schema.
 *
 * z.infer<typeof schema> automatically creates a TypeScript type
 * that matches the schema. This keeps types and validation in sync.
 */
export type CreateActivityInput = z.infer<typeof createActivitySchema>

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Formats an activity into a human-readable message.
 *
 * @param activity - The activity to format
 * @returns A string like "John created task Fix login bug"
 *
 * WHAT ARE PARAMETERS?
 * - Parameters are inputs to a function
 * - "activity: Activity" means we need an Activity object
 * - ": string" after the parentheses means this function returns a string
 */
export function formatActivityMessage(activity: Activity): string {
  // Get the message template for this activity type
  const template = ACTIVITY_MESSAGES[activity.type]

  // Replace placeholders with actual values
  return template
    .replace('{actor}', activity.actorName)
    .replace('{target}', activity.targetName)
}

/**
 * Gets the URL path for an activity's target.
 *
 * This lets users click on an activity to go to the related item.
 * For example, clicking a task activity takes you to the tasks page.
 *
 * @param activity - The activity to get the link for
 * @returns A URL path like "/tasks" or null if no link available
 */
export function getActivityTargetUrl(activity: Activity): string | null {
  // Map target types to their URL paths
  const urlMap: Record<ActivityTargetType, string | null> = {
    task: '/tasks',
    metric: '/dashboard',
    member: '/team',
    investor: `/investors/${activity.targetId}`,
    meeting: `/investors`,
    round: '/fundraising',
    term_sheet: '/fundraising',
    objective: '/okrs',
    key_result: '/okrs',
    document: `/documents/${activity.targetId}`,
    note: `/notes/${activity.targetId}`,
    roadmap_item: '/roadmap',
    milestone: '/roadmap',
    integration: '/integrations',
  }

  return urlMap[activity.targetType]
}

/**
 * Groups activities by date for display.
 *
 * This creates sections like "Today", "Yesterday", "January 15, 2024"
 *
 * @param activities - Array of activities to group
 * @returns Object with date strings as keys and activity arrays as values
 *
 * WHAT IS Map<string, Activity[]>?
 * - Map is a collection of key-value pairs
 * - Keys are date strings, values are arrays of activities
 */
export function groupActivitiesByDate(
  activities: Activity[]
): Map<string, Activity[]> {
  const groups = new Map<string, Activity[]>()
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  for (const activity of activities) {
    const activityDate = new Date(activity.createdAt)
    let dateKey: string

    // Check if it's today
    if (activityDate.toDateString() === today.toDateString()) {
      dateKey = 'Today'
    }
    // Check if it's yesterday
    else if (activityDate.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday'
    }
    // Otherwise use the full date
    else {
      dateKey = activityDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    }

    // Add to the group (create array if it doesn't exist)
    if (!groups.has(dateKey)) {
      groups.set(dateKey, [])
    }
    groups.get(dateKey)!.push(activity)
  }

  return groups
}
