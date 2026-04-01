'use client'

/**
 * EventModal Component
 *
 * Modal for creating and editing calendar events.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/lib/actions/calendar'
import type {
  CalendarEvent,
  CalendarEventType,
  RecurrencePattern,
  CreateCalendarEventInput,
  UpdateCalendarEventInput,
} from '@/types/calendar'
import {
  CALENDAR_EVENT_TYPES,
  CALENDAR_EVENT_TYPE_LABELS,
  CALENDAR_EVENT_TYPE_ICONS,
  RECURRENCE_PATTERNS,
  RECURRENCE_LABELS,
  CALENDAR_EVENT_TYPE_COLORS,
} from '@/types/calendar'

/**
 * Map event types to hex colors.
 * These correspond to the Tailwind colors used in the calendar.
 */
const EVENT_TYPE_HEX_COLORS: Record<CalendarEventType, string> = {
  meeting: '#3b82f6',   // blue-500
  deadline: '#ef4444',  // red-500
  event: '#a855f7',     // purple-500
  reminder: '#f59e0b',  // amber-500
  milestone: '#22c55e', // green-500
  other: '#64748b',     // slate-500
}

interface EventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: CalendarEvent
  defaultDate?: Date
  onSuccess: () => void
}

export function EventModal({
  open,
  onOpenChange,
  event,
  defaultDate,
  onSuccess,
}: EventModalProps) {
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<CalendarEventType>('meeting')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('10:00')
  const [isAllDay, setIsAllDay] = useState(false)
  const [location, setLocation] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [recurrence, setRecurrence] = useState<RecurrencePattern>('none')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form
  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description)
      setType(event.type)
      const startDateTime = new Date(event.startTime)
      const endDateTime = new Date(event.endTime)
      setStartDate(startDateTime.toISOString().split('T')[0])
      setStartTime(startDateTime.toTimeString().slice(0, 5))
      setEndDate(endDateTime.toISOString().split('T')[0])
      setEndTime(endDateTime.toTimeString().slice(0, 5))
      setIsAllDay(event.isAllDay)
      setLocation(event.location || '')
      setMeetingUrl(event.meetingUrl || '')
      setRecurrence(event.recurrence)
    } else {
      // Default values
      setTitle('')
      setDescription('')
      setType('meeting')
      const date = defaultDate || new Date()
      setStartDate(date.toISOString().split('T')[0])
      setStartTime('09:00')
      setEndDate(date.toISOString().split('T')[0])
      setEndTime('10:00')
      setIsAllDay(false)
      setLocation('')
      setMeetingUrl('')
      setRecurrence('none')
    }
    setError(null)
  }, [event, defaultDate, open])

  /**
   * Handle form submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Build datetime strings
      const startDateTime = isAllDay
        ? `${startDate}T00:00:00`
        : `${startDate}T${startTime}:00`
      const endDateTime = isAllDay
        ? `${endDate}T23:59:59`
        : `${endDate}T${endTime}:00`

      if (event) {
        // Update existing event
        const input: UpdateCalendarEventInput = {
          title,
          description,
          type,
          startTime: new Date(startDateTime).toISOString(),
          endTime: new Date(endDateTime).toISOString(),
          isAllDay,
          location: location || undefined,
          meetingUrl: meetingUrl || undefined,
          recurrence,
        }

        const result = await updateCalendarEvent(event.id, input)
        if (!result.success) {
          setError(result.error.message)
          return
        }
      } else {
        // Create new event
        const input: CreateCalendarEventInput = {
          title,
          description,
          type,
          startTime: new Date(startDateTime).toISOString(),
          endTime: new Date(endDateTime).toISOString(),
          isAllDay,
          color: EVENT_TYPE_HEX_COLORS[type], // Color based on event type
          location: location || undefined,
          meetingUrl: meetingUrl || undefined,
          recurrence,
          attendees: [],
          reminders: [15, 60],
        }

        const result = await createCalendarEvent(input)
        if (!result.success) {
          setError(result.error.message)
          return
        }
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Save event error:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle delete.
   */
  const handleDelete = async () => {
    if (!event) return
    if (!confirm('Are you sure you want to delete this event?')) return

    setIsDeleting(true)
    try {
      const result = await deleteCalendarEvent(event.id)
      if (!result.success) {
        setError(result.error.message)
        return
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Delete event error:', err)
      setError('Failed to delete event.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Add Event'}</DialogTitle>
          <DialogDescription>
            {event ? 'Update the event details.' : 'Create a new calendar event.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title"
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as CalendarEventType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALENDAR_EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {CALENDAR_EVENT_TYPE_ICONS[t]} {CALENDAR_EVENT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAllDay"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isAllDay" className="font-normal cursor-pointer">
              All day event
            </Label>
          </div>

          {/* Start Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            {!isAllDay && (
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* End Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            {!isAllDay && (
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label>Repeat</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrencePattern)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_PATTERNS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {RECURRENCE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Physical location or room"
            />
          </div>

          {/* Meeting URL */}
          <div className="space-y-2">
            <Label htmlFor="meetingUrl">Meeting Link</Label>
            <Input
              id="meetingUrl"
              type="url"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://zoom.us/..."
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <DialogFooter className="flex justify-between">
            <div>
              {event && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !title.trim()}>
                {isSubmitting ? 'Saving...' : event ? 'Save Changes' : 'Create Event'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
