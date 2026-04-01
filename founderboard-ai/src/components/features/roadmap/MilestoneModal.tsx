'use client'

/**
 * MilestoneModal Component
 *
 * Modal for creating and editing roadmap milestones.
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
import { createMilestone, updateMilestone, deleteMilestone } from '@/lib/actions/roadmap'
import type {
  RoadmapMilestone,
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from '@/types/roadmap'

interface MilestoneModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  milestone?: RoadmapMilestone
  onSuccess: () => void
}

// Preset colors for milestones
const MILESTONE_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#0ea5e9', // Sky
  '#6b7280', // Gray
]

export function MilestoneModal({
  open,
  onOpenChange,
  milestone,
  onSuccess,
}: MilestoneModalProps) {
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [isCompleted, setIsCompleted] = useState(false)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form
  useEffect(() => {
    if (milestone) {
      setName(milestone.name)
      setDescription(milestone.description)
      setTargetDate(milestone.targetDate)
      setColor(milestone.color)
      setIsCompleted(milestone.isCompleted)
    } else {
      setName('')
      setDescription('')
      // Default to end of current quarter
      const now = new Date()
      const quarterEnd = new Date(now.getFullYear(), Math.ceil((now.getMonth() + 1) / 3) * 3, 0)
      setTargetDate(quarterEnd.toISOString().split('T')[0])
      setColor('#6366f1')
      setIsCompleted(false)
    }
    setError(null)
  }, [milestone, open])

  /**
   * Handle form submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (milestone) {
        // Update existing milestone
        const input: UpdateMilestoneInput = {
          name,
          description,
          targetDate,
          color,
          isCompleted,
        }

        const result = await updateMilestone(milestone.id, input)
        if (!result.success) {
          setError(result.error.message)
          return
        }
      } else {
        // Create new milestone
        const input: CreateMilestoneInput = {
          name,
          description,
          targetDate,
          color,
        }

        const result = await createMilestone(input)
        if (!result.success) {
          setError(result.error.message)
          return
        }
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Save milestone error:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle delete.
   */
  const handleDelete = async () => {
    if (!milestone) return
    if (!confirm('Are you sure you want to delete this milestone?')) return

    setIsDeleting(true)
    try {
      const result = await deleteMilestone(milestone.id)
      if (!result.success) {
        setError(result.error.message)
        return
      }

      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Delete milestone error:', err)
      setError('Failed to delete milestone.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{milestone ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
          <DialogDescription>
            {milestone
              ? 'Update the milestone details.'
              : 'Add a key milestone to your roadmap.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Milestone Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., MVP Launch, Public Beta"
              required
            />
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Date</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {MILESTONE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this milestone represent?"
              rows={2}
            />
          </div>

          {/* Completed Toggle (only for existing milestones) */}
          {milestone && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isCompleted"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="isCompleted" className="font-normal cursor-pointer">
                Mark as completed
              </Label>
            </div>
          )}

          {/* Actions */}
          <DialogFooter className="flex justify-between">
            <div>
              {milestone && (
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
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? 'Saving...' : milestone ? 'Save Changes' : 'Create Milestone'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
