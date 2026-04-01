'use client'

/**
 * InvestorCard Component
 *
 * This component displays a single investor as a card in the pipeline/Kanban view.
 * Think of it like a sticky note on a board - it shows key info at a glance.
 *
 * WHAT THIS COMPONENT DOES:
 * - Shows investor name, firm, and type
 * - Displays priority indicator (color-coded dot)
 * - Shows next follow-up date if set
 * - Clicking opens the investor detail page
 *
 * REACT CONCEPTS USED:
 * - Props: Data passed from parent component
 * - Event handlers: onClick for navigation
 * - Conditional rendering: Show elements only if data exists
 */

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Investor } from '@/types/investors'
import { INVESTOR_TYPE_LABELS } from '@/types/investors'

// ========================================
// COMPONENT PROPS
// ========================================

/**
 * Props are the inputs to a React component.
 * Think of them like function parameters.
 *
 * @property investor - The investor data to display
 * @property onClick - Optional callback when card is clicked (for drag-and-drop)
 */
interface InvestorCardProps {
  investor: Investor
  onClick?: () => void
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Formats a date string into a human-readable format.
 *
 * @param dateString - ISO date string like "2024-01-15T10:30:00.000Z"
 * @returns Formatted string like "Jan 15" or "Overdue" if in the past
 *
 * WHY THIS FUNCTION?
 * - ISO dates are not user-friendly
 * - We want to show "Overdue" for past dates (visual urgency)
 * - Keeps the main component code cleaner
 */
function formatFollowUpDate(dateString: string): { text: string; isOverdue: boolean } {
  const date = new Date(dateString)
  const now = new Date()

  // Check if the date is in the past
  const isOverdue = date < now

  // Format the date
  const text = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return { text, isOverdue }
}

/**
 * Gets the color class for a priority level.
 *
 * @param priority - 'low', 'medium', or 'high'
 * @returns Tailwind CSS class for the color
 *
 * WHY USE A FUNCTION?
 * - Keeps the styling logic separate from JSX
 * - Easy to change colors in one place
 * - Makes the component more readable
 */
function getPriorityColor(priority: 'low' | 'medium' | 'high' | undefined): string {
  switch (priority) {
    case 'high':
      return 'bg-red-500' // Red = urgent/important
    case 'medium':
      return 'bg-yellow-500' // Yellow = moderate priority
    case 'low':
      return 'bg-green-500' // Green = can wait
    default:
      return 'bg-gray-300' // Gray = no priority set
  }
}

// ========================================
// MAIN COMPONENT
// ========================================

/**
 * InvestorCard - Displays an investor in a card format.
 *
 * This is a "presentational" component - it just displays data.
 * The parent component handles fetching data and business logic.
 */
export function InvestorCard({ investor, onClick }: InvestorCardProps) {
  // useRouter gives us navigation capabilities
  const router = useRouter()

  /**
   * Handle card click - navigate to investor detail page.
   *
   * WHY stopPropagation()?
   * - When using drag-and-drop, we don't want clicking to also trigger drag
   * - stopPropagation prevents the event from bubbling up to parent handlers
   */
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Navigate to the investor detail page
      router.push(`/investors/${investor.id}`)
    }
  }

  // Format follow-up date if it exists
  const followUp = investor.nextFollowUpAt
    ? formatFollowUpDate(investor.nextFollowUpAt)
    : null

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={handleClick}
    >
      <CardContent className="p-3">
        {/* Header Row: Priority dot + Type badge */}
        <div className="flex items-center justify-between mb-2">
          {/* Priority Indicator */}
          <div className="flex items-center gap-2">
            {/*
              This is a small colored dot showing priority.
              w-2 h-2 = 8px width and height
              rounded-full = makes it a circle
            */}
            <div
              className={`w-2 h-2 rounded-full ${getPriorityColor(investor.priority)}`}
              title={investor.priority ? `${investor.priority} priority` : 'No priority'}
            />

            {/* Investor Type Badge */}
            <Badge variant="secondary" className="text-xs">
              {INVESTOR_TYPE_LABELS[investor.type]}
            </Badge>
          </div>
        </div>

        {/* Investor Name */}
        <h3 className="font-medium text-sm truncate" title={investor.name}>
          {investor.name}
        </h3>

        {/* Firm Name (if exists) */}
        {investor.firm && (
          <p className="text-xs text-muted-foreground truncate" title={investor.firm}>
            {investor.firm}
          </p>
        )}

        {/* Footer Row: Follow-up date or Last contact */}
        <div className="mt-2 flex items-center justify-between text-xs">
          {/* Follow-up Date */}
          {followUp && (
            <span
              className={`${
                followUp.isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'
              }`}
            >
              {followUp.isOverdue ? 'Overdue: ' : 'Follow up: '}
              {followUp.text}
            </span>
          )}

          {/* Check Size Range (if exists) */}
          {investor.checkSize && (
            <span className="text-muted-foreground">
              ${(investor.checkSize.min / 1000).toFixed(0)}K-
              ${(investor.checkSize.max / 1000).toFixed(0)}K
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
