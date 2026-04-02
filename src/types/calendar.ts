/**
 * Calendar Types & Schemas
 *
 * This file defines all data structures for the Calendar feature.
 *
 * WHAT IS THE CALENDAR FEATURE?
 * A shared calendar for the organization to track:
 * - Meetings (team meetings, investor calls)
 * - Deadlines (launch dates, filing deadlines)
 * - Events (conferences, demos)
 * - Reminders (follow-ups, check-ins)
 */

import { z } from 'zod'

// ========================================
// EVENT TYPES
// ========================================

/**
 * Types of calendar events.
 */
export type CalendarEventType =
  | 'meeting'    // Internal or external meeting
  | 'deadline'   // Important due date
  | 'event'      // Conference, demo, presentation
  | 'reminder'   // Follow-up, check-in
  | 'milestone'  // Product/company milestone
  | 'other'      // Anything else

export const CALENDAR_EVENT_TYPES: CalendarEventType[] = [
  'meeting',
  'deadline',
  'event',
  'reminder',
  'milestone',
  'other',
]

export const CALENDAR_EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  meeting: 'Meeting',
  deadline: 'Deadline',
  event: 'Event',
  reminder: 'Reminder',
  milestone: 'Milestone',
  other: 'Other',
}

export const CALENDAR_EVENT_TYPE_ICONS: Record<CalendarEventType, string> = {
  meeting: '🤝',
  deadline: '⏰',
  event: '📅',
  reminder: '🔔',
  milestone: '🎯',
  other: '📌',
}

export const CALENDAR_EVENT_TYPE_COLORS: Record<CalendarEventType, string> = {
  meeting: 'bg-blue-500',
  deadline: 'bg-red-500',
  event: 'bg-purple-500',
  reminder: 'bg-amber-500',
  milestone: 'bg-green-500',
  other: 'bg-slate-500',
}

/**
 * Recurrence patterns for repeating events.
 */
export type RecurrencePattern =
  | 'none'       // One-time event
  | 'daily'      // Every day
  | 'weekly'     // Every week
  | 'biweekly'   // Every 2 weeks
  | 'monthly'    // Every month
  | 'yearly'     // Every year

export const RECURRENCE_PATTERNS: RecurrencePattern[] = [
  'none',
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'yearly',
]

export const RECURRENCE_LABELS: Record<RecurrencePattern, string> = {
  none: 'Does not repeat',
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

// ========================================
// CALENDAR EVENT INTERFACE
// ========================================

/**
 * Represents a calendar event.
 */
export interface CalendarEvent {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** Event title */
  title: string

  /** Detailed description */
  description: string

  /** Type of event */
  type: CalendarEventType

  /**
   * Start date and time.
   * Format: ISO datetime string
   */
  startTime: string

  /**
   * End date and time.
   * Format: ISO datetime string
   * For all-day events, this should be the end of the day
   */
  endTime: string

  /** Is this an all-day event? */
  isAllDay: boolean

  /** Location (physical or virtual) */
  location?: string

  /** Meeting link (Zoom, Google Meet, etc.) */
  meetingUrl?: string

  /** Color for display (hex code) */
  color: string

  /** Recurrence pattern */
  recurrence: RecurrencePattern

  /** Parent event ID (for recurring event instances) */
  parentEventId?: string

  /** Attendees (user IDs or email addresses) */
  attendees: string[]

  /** Related entity (investor ID, task ID, etc.) */
  relatedToType?: string
  relatedToId?: string

  /** Reminder settings (minutes before event) */
  reminders: number[]

  /** Who created this event */
  createdBy: string
  createdByName?: string

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

/**
 * Schema for creating a calendar event.
 */
export const createCalendarEventSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),

  description: z
    .string()
    .max(2000, 'Description is too long')
    .default(''),

  type: z
    .enum(CALENDAR_EVENT_TYPES as [CalendarEventType, ...CalendarEventType[]])
    .default('meeting'),

  startTime: z.string().min(1, 'Start time is required'),

  endTime: z.string().min(1, 'End time is required'),

  isAllDay: z.boolean().default(false),

  location: z.string().max(500).optional(),

  meetingUrl: z.string().url().optional().or(z.literal('')),

  color: z.string().default('#3b82f6'), // Default to blue

  recurrence: z
    .enum(RECURRENCE_PATTERNS as [RecurrencePattern, ...RecurrencePattern[]])
    .default('none'),

  attendees: z.array(z.string()).default([]),

  relatedToType: z.string().optional(),
  relatedToId: z.string().optional(),

  reminders: z.array(z.number()).default([15, 60]), // 15 min and 1 hour before
})

/**
 * Schema for updating a calendar event.
 */
export const updateCalendarEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  type: z.enum(CALENDAR_EVENT_TYPES as [CalendarEventType, ...CalendarEventType[]]).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  isAllDay: z.boolean().optional(),
  location: z.string().max(500).optional(),
  meetingUrl: z.string().url().optional().or(z.literal('')),
  color: z.string().optional(),
  recurrence: z.enum(RECURRENCE_PATTERNS as [RecurrencePattern, ...RecurrencePattern[]]).optional(),
  attendees: z.array(z.string()).optional(),
  relatedToType: z.string().optional(),
  relatedToId: z.string().optional(),
  reminders: z.array(z.number()).optional(),
})

// ========================================
// TYPE INFERENCE
// ========================================

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get events for a specific date.
 *
 * @param events - Array of calendar events
 * @param date - Date to filter by
 * @returns Events that occur on that date
 */
export function getEventsForDate(
  events: CalendarEvent[],
  date: Date
): CalendarEvent[] {
  const dateStart = new Date(date)
  dateStart.setHours(0, 0, 0, 0)
  const dateEnd = new Date(date)
  dateEnd.setHours(23, 59, 59, 999)

  return events.filter((event) => {
    const eventStart = new Date(event.startTime)
    const eventEnd = new Date(event.endTime)

    // Event starts on this day
    if (eventStart >= dateStart && eventStart <= dateEnd) return true

    // Event ends on this day
    if (eventEnd >= dateStart && eventEnd <= dateEnd) return true

    // Event spans this day
    if (eventStart < dateStart && eventEnd > dateEnd) return true

    return false
  })
}

/**
 * Get events for a date range.
 *
 * @param events - Array of calendar events
 * @param startDate - Start of range
 * @param endDate - End of range
 * @returns Events within the range
 */
export function getEventsInRange(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.startTime)
    const eventEnd = new Date(event.endTime)

    return eventStart <= endDate && eventEnd >= startDate
  })
}

/**
 * Get upcoming events.
 *
 * @param events - Array of calendar events
 * @param limit - Maximum number of events to return
 * @returns Upcoming events sorted by start time
 */
export function getUpcomingEvents(
  events: CalendarEvent[],
  limit = 5
): CalendarEvent[] {
  const now = new Date()

  return events
    .filter((event) => new Date(event.startTime) >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, limit)
}

/**
 * Format event time for display.
 *
 * @param event - Calendar event
 * @returns Formatted time string
 */
export function formatEventTime(event: CalendarEvent): string {
  if (event.isAllDay) {
    return 'All day'
  }

  const start = new Date(event.startTime)
  const end = new Date(event.endTime)

  const startTime = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  const endTime = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return `${startTime} - ${endTime}`
}

/**
 * Format event date for display.
 *
 * @param event - Calendar event
 * @returns Formatted date string
 */
export function formatEventDate(event: CalendarEvent): string {
  const start = new Date(event.startTime)
  const end = new Date(event.endTime)

  // Same day
  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  // Different days
  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const endStr = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return `${startStr} - ${endStr}`
}

/**
 * Get the duration of an event in minutes.
 *
 * @param event - Calendar event
 * @returns Duration in minutes
 */
export function getEventDuration(event: CalendarEvent): number {
  const start = new Date(event.startTime).getTime()
  const end = new Date(event.endTime).getTime()
  return Math.round((end - start) / (1000 * 60))
}

/**
 * Generate calendar grid for a month.
 *
 * @param year - Year
 * @param month - Month (0-indexed)
 * @returns Array of weeks, each containing 7 dates
 */
export function generateMonthGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const weeks: Date[][] = []
  let currentWeek: Date[] = []

  // Add empty days before the first day of the month
  const startDayOfWeek = firstDay.getDay()
  for (let i = 0; i < startDayOfWeek; i++) {
    const date = new Date(year, month, 1 - (startDayOfWeek - i))
    currentWeek.push(date)
  }

  // Add all days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    currentWeek.push(new Date(year, month, day))

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Add empty days after the last day of the month
  if (currentWeek.length > 0) {
    const remainingDays = 7 - currentWeek.length
    for (let i = 1; i <= remainingDays; i++) {
      currentWeek.push(new Date(year, month + 1, i))
    }
    weeks.push(currentWeek)
  }

  return weeks
}

/**
 * Check if a date is today.
 *
 * @param date - Date to check
 * @returns True if the date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

/**
 * Check if a date is in the current month.
 *
 * @param date - Date to check
 * @param currentMonth - Current month (0-indexed)
 * @param currentYear - Current year
 * @returns True if the date is in the current month
 */
export function isCurrentMonth(
  date: Date,
  currentMonth: number,
  currentYear: number
): boolean {
  return date.getMonth() === currentMonth && date.getFullYear() === currentYear
}
