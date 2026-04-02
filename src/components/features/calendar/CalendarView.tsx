'use client'

/**
 * CalendarView Component
 *
 * Main calendar component with month view and event management.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Calendar,
} from 'lucide-react'
import { getCalendarEvents } from '@/lib/actions/calendar'
import { EventModal } from './EventModal'
import type { CalendarEvent } from '@/types/calendar'
import {
  generateMonthGrid,
  getEventsForDate,
  isToday,
  isCurrentMonth,
  CALENDAR_EVENT_TYPE_COLORS,
} from '@/types/calendar'

// ========================================
// MAIN COMPONENT
// ========================================

export function CalendarView() {
  // State
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Current month/year being viewed
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()

  // Generate calendar grid
  const monthGrid = useMemo(
    () => generateMonthGrid(currentYear, currentMonth),
    [currentYear, currentMonth]
  )

  // Month name for header
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  /**
   * Fetch events for the current month.
   */
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get events for the visible date range
      const startDate = new Date(currentYear, currentMonth, 1).toISOString()
      const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59).toISOString()

      const result = await getCalendarEvents(startDate, endDate)
      if (result.success) {
        setEvents(result.data)
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      console.error('Failed to fetch events:', err)
      setError('Failed to load events.')
    } finally {
      setIsLoading(false)
    }
  }, [currentMonth, currentYear])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  /**
   * Navigate to previous/next month.
   */
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  /**
   * Go to today.
   */
  const goToToday = () => {
    setCurrentMonth(new Date().getMonth())
    setCurrentYear(new Date().getFullYear())
  }

  /**
   * Handle date click.
   */
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedEvent(undefined)
    setIsModalOpen(true)
  }

  /**
   * Handle event click.
   */
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEvent(event)
    setSelectedDate(undefined)
    setIsModalOpen(true)
  }

  /**
   * Handle modal success.
   */
  const handleSuccess = () => {
    fetchEvents()
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Manage meetings, deadlines, and events
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchEvents} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedDate(new Date())
              setSelectedEvent(undefined)
              setIsModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium ml-2">{monthName}</h3>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <Skeleton className="h-[600px] w-full" />
      )}

      {/* Calendar Grid */}
      {!isLoading && (
        <Card>
          <CardContent className="p-0">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Weeks */}
            {monthGrid.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7">
                {week.map((date, dayIndex) => {
                  const dayEvents = getEventsForDate(events, date)
                  const inCurrentMonth = isCurrentMonth(date, currentMonth, currentYear)
                  const isTodayDate = isToday(date)

                  return (
                    <div
                      key={dayIndex}
                      className={`min-h-24 p-1 border-b border-r cursor-pointer hover:bg-muted/50 transition-colors ${
                        !inCurrentMonth ? 'bg-muted/30' : ''
                      }`}
                      onClick={() => handleDateClick(date)}
                    >
                      {/* Date Number */}
                      <div
                        className={`text-sm mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                          isTodayDate
                            ? 'bg-primary text-primary-foreground font-bold'
                            : inCurrentMonth
                            ? ''
                            : 'text-muted-foreground'
                        }`}
                      >
                        {date.getDate()}
                      </div>

                      {/* Events */}
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs px-1 py-0.5 rounded truncate text-white ${
                              CALENDAR_EVENT_TYPE_COLORS[event.type]
                            }`}
                            onClick={(e) => handleEventClick(event, e)}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Event Modal */}
      <EventModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        event={selectedEvent}
        defaultDate={selectedDate}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
