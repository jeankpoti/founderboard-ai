/**
 * ActivityFeed Component
 *
 * Displays a chronological feed of activities in the organization.
 *
 * WHAT THIS COMPONENT DOES:
 * 1. Fetches activities from the database when it loads
 * 2. Groups activities by date (Today, Yesterday, older)
 * 3. Displays each activity using the ActivityItem component
 * 4. Shows loading and empty states
 *
 * REACT CONCEPTS USED:
 * - useState: For managing component state (activities, loading, etc.)
 * - useEffect: For running code when the component loads
 * - useCallback: For creating stable function references
 */

'use client' // This component runs in the browser

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityItem } from './ActivityItem'
import { getActivities } from '@/lib/actions/activity'
import { groupActivitiesByDate } from '@/types/activity'
import type { Activity } from '@/types/activity'

// ========================================
// COMPONENT
// ========================================

/**
 * ActivityFeed shows a list of recent activities.
 *
 * STATE MANAGEMENT:
 * - React components can have "state" - data that changes over time
 * - When state changes, React automatically re-renders the component
 * - We use useState() to create state variables
 */
export function ActivityFeed() {
  // ----------------------------------------
  // STATE
  // ----------------------------------------

  /**
   * useState returns an array with two elements:
   * 1. The current value (activities)
   * 2. A function to update the value (setActivities)
   *
   * useState<Activity[]>([]) means:
   * - The type is Activity[] (array of activities)
   * - The initial value is [] (empty array)
   */
  const [activities, setActivities] = useState<Activity[]>([])

  /** Is data currently loading? */
  const [isLoading, setIsLoading] = useState(true)

  /** Did an error occur? */
  const [error, setError] = useState<string | null>(null)

  /** Are we loading more activities? (for "Load More" button) */
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // ----------------------------------------
  // DATA FETCHING
  // ----------------------------------------

  /**
   * useCallback creates a "memoized" function.
   *
   * WHAT IS MEMOIZATION?
   * - It means React will remember this function between re-renders
   * - Without useCallback, a new function is created every render
   * - This can cause unnecessary re-renders in child components
   *
   * The empty array [] means this function never changes.
   */
  const loadActivities = useCallback(async () => {
    try {
      // Call our server action to fetch activities
      const result = await getActivities(50)

      if (result.success) {
        // Update state with the fetched activities
        setActivities(result.data)
        setError(null)
      } else {
        // Show error message
        setError(result.error.message)
      }
    } catch (err) {
      // Handle unexpected errors
      console.error('Failed to load activities:', err)
      setError('Failed to load activities. Please try again.')
    }
  }, [])

  /**
   * useEffect runs code when the component mounts or when dependencies change.
   *
   * EFFECT STRUCTURE:
   * - First argument: The function to run
   * - Second argument: Array of dependencies (when to re-run)
   *
   * Empty dependency array [] means "run once when component mounts"
   */
  useEffect(() => {
    // Load activities when component mounts
    loadActivities().finally(() => {
      setIsLoading(false)
    })
  }, [loadActivities])

  /**
   * Load more activities (for pagination).
   *
   * NOTE: This is a simplified version. In production, you'd use
   * cursor-based pagination with Firestore's startAfter().
   */
  const handleLoadMore = async () => {
    setIsLoadingMore(true)

    try {
      // Fetch more activities (we'd pass a cursor in production)
      const result = await getActivities(100)

      if (result.success) {
        setActivities(result.data)
      }
    } catch (err) {
      console.error('Failed to load more activities:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // ----------------------------------------
  // RENDER: Loading State
  // ----------------------------------------

  /**
   * While loading, show skeleton placeholders.
   *
   * WHAT ARE SKELETONS?
   * - Skeleton components show placeholder shapes while loading
   * - They give users a sense of what's coming
   * - Better UX than just showing "Loading..."
   */
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show 5 skeleton placeholders */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3">
              {/* Skeleton for icon */}
              <Skeleton className="h-8 w-8 rounded-full" />
              {/* Skeleton for content */}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // ----------------------------------------
  // RENDER: Error State
  // ----------------------------------------

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            {/* Error icon */}
            <div className="text-4xl mb-2">⚠️</div>
            <p className="text-muted-foreground mb-4">{error}</p>
            {/* Retry button */}
            <Button
              variant="outline"
              onClick={() => {
                setIsLoading(true)
                loadActivities().finally(() => setIsLoading(false))
              }}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ----------------------------------------
  // RENDER: Empty State
  // ----------------------------------------

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            {/* Empty state icon */}
            <div className="text-4xl mb-2">📭</div>
            <h3 className="font-medium mb-1">No activity yet</h3>
            <p className="text-sm text-muted-foreground">
              Activities will appear here as your team takes actions.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ----------------------------------------
  // RENDER: Activities grouped by date
  // ----------------------------------------

  // Group activities by date for better organization
  const groupedActivities = groupActivitiesByDate(activities)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Feed</CardTitle>
          {/* Refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsLoading(true)
              loadActivities().finally(() => setIsLoading(false))
            }}
          >
            {/* Refresh icon */}
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/*
          Map over the grouped activities.

          Array.from() converts the Map to an array we can iterate.
          Each entry is [dateLabel, activitiesForDate]
        */}
        {Array.from(groupedActivities.entries()).map(
          ([dateLabel, dateActivities]) => (
            <div key={dateLabel}>
              {/* Date header (Today, Yesterday, etc.) */}
              <h3 className="text-sm font-medium text-muted-foreground mb-2 px-3">
                {dateLabel}
              </h3>

              {/* Activities for this date */}
              <div className="space-y-1">
                {dateActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>
          )
        )}

        {/* Load More button */}
        {activities.length >= 50 && (
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
