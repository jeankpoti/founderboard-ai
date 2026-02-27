'use client'

/**
 * RoadmapItemModal Component
 *
 * Modal for creating and editing roadmap items.
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
import { createRoadmapItem, updateRoadmapItem, deleteRoadmapItem } from '@/lib/actions/roadmap'
import type {
  RoadmapItem,
  RoadmapMilestone,
  RoadmapItemCategory,
  RoadmapItemStatus,
  RoadmapPriority,
  CreateRoadmapItemInput,
  UpdateRoadmapItemInput,
} from '@/types/roadmap'
import {
  ROADMAP_ITEM_CATEGORIES,
  ROADMAP_CATEGORY_LABELS,
  ROADMAP_CATEGORY_ICONS,
  ROADMAP_ITEM_STATUSES,
  ROADMAP_STATUS_LABELS,
  ROADMAP_PRIORITIES,
  ROADMAP_PRIORITY_LABELS,
} from '@/types/roadmap'

interface RoadmapItemModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: RoadmapItem
  milestones: RoadmapMilestone[]
  onSuccess: () => void
}

export function RoadmapItemModal({
  open,
  onOpenChange,
  item,
  milestones,
  onSuccess,
}: RoadmapItemModalProps) {
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<RoadmapItemCategory>('feature')
  const [status, setStatus] = useState<RoadmapItemStatus>('planned')
  const [priority, setPriority] = useState<RoadmapPriority>('medium')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [progress, setProgress] = useState(0)
  const [milestoneId, setMilestoneId] = useState<string>('')

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form
  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setDescription(item.description)
      setCategory(item.category)
      setStatus(item.status)
      setPriority(item.priority)
      setStartDate(item.startDate)
      setEndDate(item.endDate)
      setProgress(item.progress)
      setMilestoneId(item.milestoneId || '')
    } else {
      // Default values for new item
      setTitle('')
      setDescription('')
      setCategory('feature')
      setStatus('planned')
      setPriority('medium')
      // Default to current quarter
      const now = new Date()
      setStartDate(now.toISOString().split('T')[0])
      const endDefault = new Date(now)
      endDefault.setMonth(endDefault.getMonth() + 1)
      setEndDate(endDefault.toISOString().split('T')[0])
      setProgress(0)
      setMilestoneId('')
    }
    setError(null)
  }, [item, open])

  /**
   * Handle form submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (item) {
        // Update existing item
        const input: UpdateRoadmapItemInput = {
          title,
          description,
          category,
          status,
          priority,
          startDate,
          endDate,
          progress,
          milestoneId: milestoneId || null,
        }

        const result = await updateRoadmapItem(item.id, input)
        if (!result.success) {
          setError(result.error.message)
          return
        }
      } else {
        // Create new item
        const input: CreateRoadmapItemInput = {
          title,
          description,
          category,
          status,
          priority,
          startDate,
          endDate,
          progress,
          milestoneId: milestoneId || undefined,
          assignees: [],
          tags: [],
          dependencies: [],
        }

        const result = await createRoadmapItem(input)
        if (!result.success) {
          setError(result.error.message)
          return
        }
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Save roadmap item error:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle delete.
   */
  const handleDelete = async () => {
    if (!item) return
    if (!confirm('Are you sure you want to delete this item?')) return

    setIsDeleting(true)
    try {
      const result = await deleteRoadmapItem(item.id)
      if (!result.success) {
        setError(result.error.message)
        return
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Delete roadmap item error:', err)
      setError('Failed to delete item.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Roadmap Item' : 'Add Roadmap Item'}</DialogTitle>
          <DialogDescription>
            {item ? 'Update the roadmap item details.' : 'Add a new item to your roadmap.'}
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
              placeholder="e.g., User authentication system"
              required
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as RoadmapItemCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROADMAP_ITEM_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {ROADMAP_CATEGORY_ICONS[cat]} {ROADMAP_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as RoadmapItemStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROADMAP_ITEM_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ROADMAP_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority & Milestone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as RoadmapPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROADMAP_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {ROADMAP_PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Milestone</Label>
              <Select value={milestoneId} onValueChange={setMilestoneId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {milestones.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
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
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Label>Progress: {progress}%</Label>
            <input
              type="range"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              min={0}
              max={100}
              step={5}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the feature or project..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <DialogFooter className="flex justify-between">
            <div>
              {item && (
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
                {isSubmitting ? 'Saving...' : item ? 'Save Changes' : 'Create Item'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
