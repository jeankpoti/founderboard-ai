'use client'

/**
 * ObjectiveModal Component
 *
 * Modal for creating or editing an Objective.
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createObjective, updateObjective } from '@/lib/actions/okrs'
import type { Objective, CreateObjectiveInput, OKRPeriod } from '@/types/okrs'
import { OKR_PERIODS, OKR_PERIOD_LABELS, OKR_STATUSES, OKR_STATUS_LABELS } from '@/types/okrs'

interface ObjectiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  objective?: Objective
  defaultPeriod?: string
  defaultYear?: number
  onSuccess?: (objective: Objective) => void
}

const INITIAL_FORM_STATE: CreateObjectiveInput = {
  title: '',
  description: '',
  period: 'q1',
  year: new Date().getFullYear(),
  status: 'draft',
}

export function ObjectiveModal({
  open,
  onOpenChange,
  objective,
  defaultPeriod,
  defaultYear,
  onSuccess,
}: ObjectiveModalProps) {
  const [formData, setFormData] = useState<CreateObjectiveInput>(INITIAL_FORM_STATE)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (objective) {
        setFormData({
          title: objective.title,
          description: objective.description || '',
          period: objective.period,
          year: objective.year,
          status: objective.status,
          ownerId: objective.ownerId,
        })
      } else {
        setFormData({
          ...INITIAL_FORM_STATE,
          period: (defaultPeriod as OKRPeriod) || 'q1',
          year: defaultYear || new Date().getFullYear(),
        })
      }
      setError(null)
    }
  }, [open, objective, defaultPeriod, defaultYear])

  const handleChange = (field: keyof CreateObjectiveInput, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = objective
        ? await updateObjective(objective.id, formData)
        : await createObjective(formData)

      if (result.success) {
        onSuccess?.(result.data)
        onOpenChange(false)
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      console.error('Failed to save objective:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  const isEditMode = !!objective

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Objective' : 'Create Objective'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update your objective details.'
              : 'Define what you want to achieve this period.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Objective <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Become the leading platform for..."
            />
            <p className="text-xs text-muted-foreground">
              What do you want to achieve? Be ambitious and inspiring.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Period</Label>
              <Select
                value={formData.period}
                onValueChange={(v) => handleChange('period', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OKR_PERIODS.map((period) => (
                    <SelectItem key={period} value={period}>
                      {OKR_PERIOD_LABELS[period]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(v) => handleChange('year', parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => handleChange('status', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OKR_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {OKR_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="More context about this objective..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Objective'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
