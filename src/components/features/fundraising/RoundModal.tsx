'use client'

/**
 * RoundModal Component
 *
 * A modal dialog for creating or editing a fundraising round.
 * Collects all the essential information about a round.
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
import { createRound, updateRound } from '@/lib/actions/fundraising'
import type { FundraisingRound, CreateRoundInput } from '@/types/fundraising'
import {
  ROUND_TYPES,
  ROUND_TYPE_LABELS,
  ROUND_STATUSES,
  ROUND_STATUS_LABELS,
} from '@/types/fundraising'

// ========================================
// COMPONENT PROPS
// ========================================

interface RoundModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  round?: FundraisingRound
  onSuccess?: (round: FundraisingRound) => void
}

// ========================================
// INITIAL STATE
// ========================================

const INITIAL_FORM_STATE: CreateRoundInput = {
  name: '',
  type: 'seed',
  status: 'planning',
  targetAmount: 0,
  raisedAmount: 0,
  currency: 'USD',
  notes: '',
}

// ========================================
// MAIN COMPONENT
// ========================================

export function RoundModal({
  open,
  onOpenChange,
  round,
  onSuccess,
}: RoundModalProps) {
  const [formData, setFormData] = useState<CreateRoundInput>(INITIAL_FORM_STATE)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (round) {
        setFormData({
          name: round.name,
          type: round.type,
          status: round.status,
          targetAmount: round.targetAmount,
          raisedAmount: round.raisedAmount,
          currency: round.currency,
          preMoneyValuation: round.preMoneyValuation,
          postMoneyValuation: round.postMoneyValuation,
          startDate: round.startDate,
          closeDate: round.closeDate,
          notes: round.notes || '',
        })
      } else {
        setFormData(INITIAL_FORM_STATE)
      }
      setError(null)
    }
  }, [open, round])

  const handleChange = (field: keyof CreateRoundInput, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = round
        ? await updateRound(round.id, formData)
        : await createRound(formData)

      if (result.success) {
        onSuccess?.(result.data)
        onOpenChange(false)
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      console.error('Failed to save round:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isEditMode = !!round

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Round' : 'Create Fundraising Round'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the round details below.'
              : 'Enter the details for your fundraising round.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Round Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Seed Round 2024"
            />
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Round Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ROUND_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {ROUND_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ROUND_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {ROUND_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target and Raised */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount ($)</Label>
              <Input
                id="targetAmount"
                type="number"
                value={formData.targetAmount || ''}
                onChange={(e) =>
                  handleChange('targetAmount', parseFloat(e.target.value) || 0)
                }
                placeholder="1500000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="raisedAmount">Raised Amount ($)</Label>
              <Input
                id="raisedAmount"
                type="number"
                value={formData.raisedAmount || ''}
                onChange={(e) =>
                  handleChange('raisedAmount', parseFloat(e.target.value) || 0)
                }
                placeholder="500000"
              />
            </div>
          </div>

          {/* Valuation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preMoneyValuation">Pre-money Valuation ($)</Label>
              <Input
                id="preMoneyValuation"
                type="number"
                value={formData.preMoneyValuation || ''}
                onChange={(e) =>
                  handleChange('preMoneyValuation', parseFloat(e.target.value) || 0)
                }
                placeholder="5000000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postMoneyValuation">Post-money Valuation ($)</Label>
              <Input
                id="postMoneyValuation"
                type="number"
                value={formData.postMoneyValuation || ''}
                onChange={(e) =>
                  handleChange('postMoneyValuation', parseFloat(e.target.value) || 0)
                }
                placeholder="6500000"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes about this round..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : isEditMode ? (
              'Save Changes'
            ) : (
              'Create Round'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
