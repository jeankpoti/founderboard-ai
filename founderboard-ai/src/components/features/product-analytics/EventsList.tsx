'use client'

/**
 * EventsList Component
 *
 * Displays a list of PostHog events.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { PostHogEvent } from '@/types/integrations'

interface EventsListProps {
  events: PostHogEvent[]
  compact?: boolean
}

export function EventsList({ events, compact = false }: EventsListProps) {
  const [showCount, setShowCount] = useState(compact ? events.length : 20)

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">{"[x]"}</div>
        <p className="text-muted-foreground">No events yet</p>
        <p className="text-sm text-muted-foreground">
          Events will appear here once loaded from PostHog.
        </p>
      </div>
    )
  }

  const totalEvents = events.reduce((sum, e) => sum + e.eventCount, 0)
  const visibleEvents = events.slice(0, showCount)

  return (
    <div className="space-y-2">
      {visibleEvents.map((event, index) => {
        const percentage = totalEvents > 0
          ? ((event.eventCount / totalEvents) * 100).toFixed(1)
          : '0'

        return (
          <div
            key={event.id}
            className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors ${
              compact ? 'p-2' : ''
            }`}
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {index + 1}
            </div>

            {/* Event Info */}
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${compact ? 'text-sm' : ''}`}>{event.name}</p>
              {!compact && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.uniqueUsers.toLocaleString()} unique users
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex-shrink-0 text-right">
              <p className="font-medium">{event.eventCount.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{percentage}%</p>
            </div>
          </div>
        )
      })}

      {!compact && events.length > showCount && (
        <div className="text-center pt-2">
          <Button variant="outline" onClick={() => setShowCount(showCount + 20)}>
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
