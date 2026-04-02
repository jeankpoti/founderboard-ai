/**
 * ActivityItem Component
 *
 * Displays a single activity in the activity feed.
 *
 * WHAT IS A COMPONENT?
 * - A component is a reusable piece of UI
 * - It's like a custom HTML tag that you define
 * - Components can receive data through "props" (properties)
 *
 * COMPONENT STRUCTURE:
 * 1. Imports at the top
 * 2. Type definitions for props
 * 3. The component function
 * 4. Export at the bottom
 */

'use client' // This tells Next.js this component runs in the browser

import Link from 'next/link'
import type {
  Activity,
  ActivityType,
} from '@/types/activity'
import {
  ACTIVITY_ICONS,
  formatActivityMessage,
  getActivityTargetUrl,
} from '@/types/activity'

// ========================================
// PROPS TYPE
// ========================================

/**
 * Props are the data passed to a component.
 *
 * Think of props like function parameters - they let you
 * customize how the component looks or behaves.
 */
interface ActivityItemProps {
  /** The activity data to display */
  activity: Activity

  /** Whether to show a compact version (less detail) */
  compact?: boolean // The "?" means this prop is optional
}

// ========================================
// HELPER FUNCTION
// ========================================

/**
 * Formats a date into a relative time string.
 *
 * Examples:
 * - "Just now" (less than a minute ago)
 * - "5m ago" (5 minutes ago)
 * - "2h ago" (2 hours ago)
 * - "3d ago" (3 days ago)
 * - "Jan 15" (older than a week)
 *
 * @param dateString - ISO date string to format
 * @returns Human-readable relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()

  // Calculate the difference in milliseconds
  const diffMs = now.getTime() - date.getTime()

  // Convert to different units
  const diffMins = Math.floor(diffMs / 60000) // 60 * 1000
  const diffHours = Math.floor(diffMs / 3600000) // 60 * 60 * 1000
  const diffDays = Math.floor(diffMs / 86400000) // 24 * 60 * 60 * 1000

  // Return appropriate format based on how long ago
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  // For older dates, show the actual date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Get background color for activity type.
 * Different activities have different accent colors for visual distinction.
 */
function getActivityColor(type: ActivityType): string {
  // Group activities by category for consistent coloring
  const colors: Record<string, string> = {
    // Task activities - blue
    task_created: 'bg-blue-100 text-blue-700',
    task_updated: 'bg-blue-100 text-blue-700',
    task_completed: 'bg-green-100 text-green-700',
    task_deleted: 'bg-red-100 text-red-700',
    task_assigned: 'bg-blue-100 text-blue-700',

    // Metric activities - purple
    metric_updated: 'bg-purple-100 text-purple-700',

    // Team activities - yellow/orange
    member_joined: 'bg-yellow-100 text-yellow-700',
    member_left: 'bg-orange-100 text-orange-700',
    member_invited: 'bg-yellow-100 text-yellow-700',
    member_role_changed: 'bg-orange-100 text-orange-700',

    // Investor activities - green
    investor_added: 'bg-emerald-100 text-emerald-700',
    investor_updated: 'bg-emerald-100 text-emerald-700',
    investor_stage_changed: 'bg-emerald-100 text-emerald-700',
    meeting_scheduled: 'bg-cyan-100 text-cyan-700',
    meeting_completed: 'bg-cyan-100 text-cyan-700',

    // Fundraising - pink
    round_created: 'bg-pink-100 text-pink-700',
    round_updated: 'bg-pink-100 text-pink-700',
    term_sheet_received: 'bg-pink-100 text-pink-700',

    // OKR - indigo
    objective_created: 'bg-indigo-100 text-indigo-700',
    objective_updated: 'bg-indigo-100 text-indigo-700',
    key_result_updated: 'bg-indigo-100 text-indigo-700',
    key_result_completed: 'bg-green-100 text-green-700',

    // Documents/Notes - gray
    document_uploaded: 'bg-gray-100 text-gray-700',
    document_shared: 'bg-gray-100 text-gray-700',
    note_created: 'bg-gray-100 text-gray-700',
    note_updated: 'bg-gray-100 text-gray-700',

    // Roadmap - teal
    roadmap_item_created: 'bg-teal-100 text-teal-700',
    roadmap_item_updated: 'bg-teal-100 text-teal-700',
    milestone_reached: 'bg-green-100 text-green-700',

    // Integrations - slate
    integration_connected: 'bg-slate-100 text-slate-700',
    integration_disconnected: 'bg-slate-100 text-slate-700',
  }

  return colors[type] || 'bg-gray-100 text-gray-700'
}

// ========================================
// COMPONENT
// ========================================

/**
 * ActivityItem displays a single activity entry.
 *
 * COMPONENT PATTERNS:
 * - Functional component: A function that returns JSX
 * - Destructuring: { activity, compact = false } extracts props
 * - Default values: compact = false provides a default
 */
export function ActivityItem({ activity, compact = false }: ActivityItemProps) {
  // Get the URL to link to (if any)
  const targetUrl = getActivityTargetUrl(activity)

  // Get the icon for this activity type
  const icon = ACTIVITY_ICONS[activity.type]

  // Format the message (e.g., "John created task Fix bug")
  const message = formatActivityMessage(activity)

  // Format the time (e.g., "5m ago")
  const timeAgo = formatRelativeTime(activity.createdAt)

  // Get the color classes for this activity type
  const colorClasses = getActivityColor(activity.type)

  // ----------------------------------------
  // RENDER: Compact version (just icon and message)
  // ----------------------------------------
  if (compact) {
    return (
      <div className="flex items-center gap-2 py-1">
        {/* Icon */}
        <span className="text-sm">{icon}</span>

        {/* Message - truncated if too long */}
        <span className="text-sm text-muted-foreground truncate">
          {message}
        </span>

        {/* Time */}
        <span className="text-xs text-muted-foreground ml-auto">
          {timeAgo}
        </span>
      </div>
    )
  }

  // ----------------------------------------
  // RENDER: Full version (with avatar and details)
  // ----------------------------------------
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      {/* Icon with colored background */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClasses}`}
      >
        <span className="text-sm">{icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Message */}
        <p className="text-sm">
          {/* Actor name in bold */}
          <span className="font-medium">{activity.actorName}</span>{' '}

          {/* Action description */}
          <span className="text-muted-foreground">
            {/* Remove actor name from message since we show it separately */}
            {message.replace(activity.actorName, '').trim()}
          </span>
        </p>

        {/* Time and link */}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>

          {/* Link to the target (if available) */}
          {targetUrl && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <Link
                href={targetUrl}
                className="text-xs text-primary hover:underline"
              >
                View
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
