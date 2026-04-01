'use server'

/**
 * Calendar Server Actions
 *
 * Server-side functions for managing calendar events.
 *
 * WHAT IS THE CALENDAR?
 * A shared calendar for the organization to track meetings,
 * deadlines, events, and reminders.
 */

import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { getOrgContext } from '@/lib/auth/org-context'
import {
  createCalendarEventSchema,
  updateCalendarEventSchema,
} from '@/types/calendar'
import type { ApiResponse } from '@/types/api'
import type {
  CalendarEvent,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from '@/types/calendar'

// ========================================
// GET EVENTS
// ========================================

/**
 * Get all calendar events for the organization.
 *
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 */
export async function getCalendarEvents(
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<CalendarEvent[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    let query = db
      .collection(COLLECTIONS.CALENDAR_EVENTS)
      .where('orgId', '==', orgContext.organization.id)

    // Add date filters if provided
    if (startDate) {
      query = query.where('startTime', '>=', startDate)
    }
    if (endDate) {
      query = query.where('startTime', '<=', endDate)
    }

    query = query.orderBy('startTime', 'asc')

    const snapshot = await query.get()

    const events = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      }
    }) as CalendarEvent[]

    return { success: true, data: events }
  } catch (error) {
    console.error('Get calendar events error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch calendar events' },
    }
  }
}

/**
 * Get a single calendar event by ID.
 */
export async function getCalendarEvent(
  eventId: string
): Promise<ApiResponse<CalendarEvent>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    const doc = await db.collection(COLLECTIONS.CALENDAR_EVENTS).doc(eventId).get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Event not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const event: CalendarEvent = {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as CalendarEvent

    return { success: true, data: event }
  } catch (error) {
    console.error('Get calendar event error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch event' },
    }
  }
}

/**
 * Get upcoming events for the organization.
 *
 * @param limit - Maximum number of events to return
 */
export async function getUpcomingCalendarEvents(
  limit = 10
): Promise<ApiResponse<CalendarEvent[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    const now = new Date().toISOString()

    const snapshot = await db
      .collection(COLLECTIONS.CALENDAR_EVENTS)
      .where('orgId', '==', orgContext.organization.id)
      .where('startTime', '>=', now)
      .orderBy('startTime', 'asc')
      .limit(limit)
      .get()

    const events = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      }
    }) as CalendarEvent[]

    return { success: true, data: events }
  } catch (error) {
    console.error('Get upcoming events error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch upcoming events' },
    }
  }
}

// ========================================
// CREATE EVENT
// ========================================

/**
 * Create a new calendar event.
 */
export async function createCalendarEvent(
  input: CreateCalendarEventInput
): Promise<ApiResponse<CalendarEvent>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot create events' },
      }
    }

    // Validate input
    const validation = createCalendarEventSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0]?.message || 'Invalid input',
        },
      }
    }

    // Validate times
    if (new Date(validation.data.endTime) < new Date(validation.data.startTime)) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'End time must be after start time' },
      }
    }

    const db = adminDb()
    const now = new Date().toISOString()

    // Get creator name
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(orgContext.user.uid).get()
    const createdByName = userDoc.exists ? userDoc.data()?.displayName : undefined

    // Clean up meetingUrl if empty
    const { meetingUrl, ...restData } = validation.data

    // Create event
    const eventRef = db.collection(COLLECTIONS.CALENDAR_EVENTS).doc()
    const eventData: Omit<CalendarEvent, 'id'> = {
      orgId: orgContext.organization.id,
      ...restData,
      ...(meetingUrl && { meetingUrl }),
      createdBy: orgContext.user.uid,
      createdByName,
      createdAt: now,
      updatedAt: now,
    }

    await eventRef.set(eventData)

    return {
      success: true,
      data: { id: eventRef.id, ...eventData },
    }
  } catch (error) {
    console.error('Create calendar event error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create event' },
    }
  }
}

// ========================================
// UPDATE EVENT
// ========================================

/**
 * Update a calendar event.
 */
export async function updateCalendarEvent(
  eventId: string,
  input: UpdateCalendarEventInput
): Promise<ApiResponse<CalendarEvent>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot update events' },
      }
    }

    // Validate input
    const validation = updateCalendarEventSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0]?.message || 'Invalid input',
        },
      }
    }

    const db = adminDb()
    const eventRef = db.collection(COLLECTIONS.CALENDAR_EVENTS).doc(eventId)
    const doc = await eventRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Event not found' },
      }
    }

    const existingData = doc.data()!
    if (existingData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Clean up meetingUrl if empty
    const { meetingUrl, ...restData } = validation.data

    const updateData: Partial<CalendarEvent> = {
      ...restData,
      ...(meetingUrl !== undefined && { meetingUrl: meetingUrl || undefined }),
      updatedAt: new Date().toISOString(),
    }

    await eventRef.update(updateData)

    const updatedEvent: CalendarEvent = {
      ...existingData,
      ...updateData,
      id: eventId,
      createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt,
    } as CalendarEvent

    return { success: true, data: updatedEvent }
  } catch (error) {
    console.error('Update calendar event error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update event' },
    }
  }
}

// ========================================
// DELETE EVENT
// ========================================

/**
 * Delete a calendar event.
 */
export async function deleteCalendarEvent(
  eventId: string
): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    // Members can delete their own events, admins can delete any
    const db = adminDb()
    const eventRef = db.collection(COLLECTIONS.CALENDAR_EVENTS).doc(eventId)
    const doc = await eventRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Event not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Check permissions: must be admin/owner or the event creator
    const isCreator = data.createdBy === orgContext.user.uid
    const isAdmin = orgContext.role === 'owner' || orgContext.role === 'admin'

    if (!isCreator && !isAdmin) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'You can only delete events you created' },
      }
    }

    await eventRef.delete()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete calendar event error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete event' },
    }
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get events for a specific month.
 */
export async function getMonthEvents(
  year: number,
  month: number
): Promise<ApiResponse<CalendarEvent[]>> {
  // Month is 0-indexed (0 = January)
  const startDate = new Date(year, month, 1).toISOString()
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

  return getCalendarEvents(startDate, endDate)
}

/**
 * Get events for a specific week.
 */
export async function getWeekEvents(
  startOfWeek: Date
): Promise<ApiResponse<CalendarEvent[]>> {
  const start = new Date(startOfWeek)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return getCalendarEvents(start.toISOString(), end.toISOString())
}

/**
 * Get today's events.
 */
export async function getTodayEvents(): Promise<ApiResponse<CalendarEvent[]>> {
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  return getCalendarEvents(startOfDay, endOfDay)
}
