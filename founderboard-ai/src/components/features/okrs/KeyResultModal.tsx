'use client'

/**
 * KeyResultModal Component
 *
 * Modal for creating or editing a Key Result.
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
import { createKeyResult, updateKeyResult, createCheckIn } from '@/lib/actions/okrs'
import type { KeyResult, CreateKeyResultInput, MetricType } from '@/types/okrs'
import { METRIC_TYPES, METRIC_TYPE_LABELS, OKR_STATUSES, OKR_STATUS_LABELS } from '@/types/okrs'

interface KeyResultModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  objectiveId?: string
  keyResult?: KeyResult
  onSuccess?: (keyResult: KeyResult) => void
}

const INITIAL_FORM_STATE: Omit<CreateKeyResultInput, 'objectiveId'> = {
  title: '',
  description: '',
  metricType: 'number',
  startValue: 0,
  targetValue: 100,
  currentValue: 0,
  status: 'active',
}

export function KeyResultModal({
  open,
  onOpenChange,
  objectiveId,
  keyResult,
  onSuccess,
}: KeyResultModalProps) {
  const [formData, setFormData] = useState<Omit<CreateKeyResultInput, 'objectiveId'>>(
    INITIAL_FORM_STATE
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCheckInMode, setIsCheckInMode] = useState(false)
  const [checkInValue, setCheckInValue] = useState<number>(0)
  const [checkInNotes, setCheckInNotes] = useState<string>('')

  useEffect(() => {
    if (open) {
      if (keyResult) {
        setFormData({
          title: keyResult.title,
          description: keyResult.description || '',
          metricType: keyResult.metricType,
          startValue: keyResult.startValue,
          targetValue: keyResult.targetValue,
          currentValue: keyResult.currentValue,
          status: keyResult.status,
          currency: keyResult.currency,
        })
        setCheckInValue(keyResult.currentValue)
      } else {
        setFormData(INITIAL_FORM_STATE)
        setCheckInValue(0)
      }
      setIsCheckInMode(false)
      setCheckInNotes('')
      setError(null)
    }
  }, [open, keyResult])

  const handleChange = (
    field: keyof Omit<CreateKeyResultInput, 'objectiveId'>,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!objectiveId && !keyResult) {
      setError('Objective ID is required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = keyResult
        ? await updateKeyResult(keyResult.id, formData)
        : await createKeyResult({
            ...formData,
            objectiveId: objectiveId!,
          })

      if (result.success) {
        onSuccess?.(result.data)
        onOpenChange(false)
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      console.error('Failed to save key result:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!keyResult) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await createCheckIn({
        keyResultId: keyResult.id,
        value: checkInValue,
        notes: checkInNotes || undefined,
      })

      if (result.success) {
        // Refresh the key result data
        const updatedKR = {
          ...keyResult,
          currentValue: checkInValue,
        } as KeyResult
        onSuccess?.(updatedKR)
        onOpenChange(false)
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      console.error('Failed to create check-in:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  const isEditMode = !!keyResult

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isCheckInMode
              ? 'Update Progress'
              : isEditMode
                ? 'Edit Key Result'
                : 'Add Key Result'}
          </DialogTitle>
          <DialogDescription>
            {isCheckInMode
              ? 'Record your current progress.'
              : isEditMode
                ? 'Update your key result details.'
                : 'Define a measurable outcome for this objective.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Check-in Mode */}
        {isCheckInMode && keyResult && (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Current Value</Label>
              <Input
                type="number"
                value={checkInValue}
                onChange={(e) => setCheckInValue(parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Target: {keyResult.targetValue} | Previous: {keyResult.currentValue}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={checkInNotes}
                onChange={(e) => setCheckInNotes(e.target.value)}
                placeholder="What progress was made?"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Create/Edit Mode */}
        {!isCheckInMode && (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Key Result <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Increase MRR from $50K to $100K"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Metric Type</Label>
                <Select
                  value={formData.metricType}
                  onValueChange={(v) => handleChange('metricType', v as MetricType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRIC_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {METRIC_TYPE_LABELS[type]}
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Start Value</Label>
                <Input
                  type="number"
                  value={formData.startValue}
                  onChange={(e) =>
                    handleChange('startValue', parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Current Value</Label>
                <Input
                  type="number"
                  value={formData.currentValue}
                  onChange={(e) =>
                    handleChange('currentValue', parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Target Value</Label>
                <Input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) =>
                    handleChange('targetValue', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="How will you measure this?"
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {isEditMode && !isCheckInMode && (
            <Button
              variant="outline"
              onClick={() => setIsCheckInMode(true)}
              disabled={isLoading}
            >
              Update Progress
            </Button>
          )}
          {isCheckInMode && (
            <Button
              variant="outline"
              onClick={() => setIsCheckInMode(false)}
              disabled={isLoading}
            >
              Back to Edit
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={isCheckInMode ? handleCheckIn : handleSubmit}
            disabled={isLoading}
          >
            {isLoading
              ? 'Saving...'
              : isCheckInMode
                ? 'Save Progress'
                : isEditMode
                  ? 'Save Changes'
                  : 'Add Key Result'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
