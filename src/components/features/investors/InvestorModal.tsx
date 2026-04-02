'use client'

/**
 * InvestorModal Component
 *
 * A dialog/modal for creating or editing an investor.
 * This is a "form modal" - it shows a form inside a popup overlay.
 *
 * WHAT IS A MODAL?
 * - A modal is a popup that appears on top of the page
 * - It "blocks" interaction with the rest of the page
 * - Users must complete or close it before continuing
 * - Great for focused tasks like filling out forms
 *
 * CONTROLLED vs UNCONTROLLED COMPONENTS:
 * - This modal is "controlled" - the parent controls if it's open
 * - The parent passes `open` and `onOpenChange` props
 * - This pattern gives the parent full control over visibility
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
import { createInvestor, updateInvestor } from '@/lib/actions/investors'
import type { Investor, CreateInvestorInput } from '@/types/investors'
import {
  INVESTOR_TYPES,
  INVESTOR_TYPE_LABELS,
  INVESTOR_STAGES,
  INVESTOR_STAGE_LABELS,
} from '@/types/investors'

// ========================================
// COMPONENT PROPS
// ========================================

interface InvestorModalProps {
  /**
   * Controls if the modal is visible.
   * true = modal is shown, false = modal is hidden
   */
  open: boolean

  /**
   * Callback when the modal should open or close.
   * This follows the "controlled component" pattern.
   *
   * @param open - The new open state
   */
  onOpenChange: (open: boolean) => void

  /**
   * If provided, we're editing this investor.
   * If undefined, we're creating a new investor.
   */
  investor?: Investor

  /**
   * Callback when an investor is successfully created/updated.
   * The parent can use this to refresh the list.
   *
   * @param investor - The created/updated investor
   */
  onSuccess?: (investor: Investor) => void
}

// ========================================
// INITIAL FORM STATE
// ========================================

/**
 * The default values for a new investor form.
 * This resets the form when creating a new investor.
 */
const INITIAL_FORM_STATE: CreateInvestorInput = {
  name: '',
  type: 'vc',
  firm: '',
  email: '',
  phone: '',
  linkedInUrl: '',
  twitterHandle: '',
  website: '',
  stage: 'lead',
  notes: '',
  source: '',
  referredBy: '',
  priority: 'medium',
}

// ========================================
// MAIN COMPONENT
// ========================================

export function InvestorModal({
  open,
  onOpenChange,
  investor,
  onSuccess,
}: InvestorModalProps) {
  /**
   * Form state - stores all the input values.
   *
   * useState returns [currentValue, setterFunction]
   * We initialize with either the investor data (edit mode) or defaults (create mode)
   */
  const [formData, setFormData] = useState<CreateInvestorInput>(INITIAL_FORM_STATE)

  /**
   * Loading state - shows a spinner when saving.
   * Prevents double-submits and shows user feedback.
   */
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Error state - stores any error message to display.
   */
  const [error, setError] = useState<string | null>(null)

  /**
   * useEffect - Runs code when certain values change.
   *
   * This effect runs when:
   * 1. The modal opens/closes (open changes)
   * 2. The investor prop changes
   *
   * It populates the form with investor data when editing,
   * or resets to defaults when creating new.
   */
  useEffect(() => {
    if (open) {
      if (investor) {
        // Edit mode: populate form with existing data
        setFormData({
          name: investor.name,
          type: investor.type,
          firm: investor.firm || '',
          email: investor.email || '',
          phone: investor.phone || '',
          linkedInUrl: investor.linkedInUrl || '',
          twitterHandle: investor.twitterHandle || '',
          website: investor.website || '',
          stage: investor.stage,
          notes: investor.notes || '',
          source: investor.source || '',
          referredBy: investor.referredBy || '',
          priority: investor.priority || 'medium',
        })
      } else {
        // Create mode: reset to defaults
        setFormData(INITIAL_FORM_STATE)
      }
      // Clear any previous errors
      setError(null)
    }
  }, [open, investor])

  /**
   * Handles form field changes.
   *
   * This is a "generic" handler that works for any field.
   * It uses the field name as the key in our state object.
   *
   * WHAT IS Partial<CreateInvestorInput>?
   * - Partial<T> makes all properties of T optional
   * - So we can pass just { name: 'value' } instead of all fields
   */
  const handleChange = (field: keyof CreateInvestorInput, value: string) => {
    setFormData((prev) => ({
      ...prev, // Keep all existing values
      [field]: value, // Update just this one field
    }))
  }

  /**
   * Handles form submission.
   *
   * ASYNC/AWAIT EXPLAINED:
   * - async marks a function that does asynchronous work
   * - await pauses execution until a Promise resolves
   * - This makes async code read like synchronous code
   */
  const handleSubmit = async () => {
    // Start loading (disable button, show spinner)
    setIsLoading(true)
    setError(null)

    try {
      // Decide whether to create or update based on if investor exists
      const result = investor
        ? await updateInvestor(investor.id, formData)
        : await createInvestor(formData)

      if (result.success) {
        // Success! Notify parent and close modal
        onSuccess?.(result.data)
        onOpenChange(false)
      } else {
        // Show error message
        setError(result.error.message)
      }
    } catch (err) {
      // Catch any unexpected errors
      console.error('Failed to save investor:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      // Always stop loading, whether success or failure
      setIsLoading(false)
    }
  }

  // Determine if we're in edit mode
  const isEditMode = !!investor

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {/* Dialog Header */}
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Investor' : 'Add New Investor'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the investor information below.'
              : 'Enter the investor details below. You can add more information later.'}
          </DialogDescription>
        </DialogHeader>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Form Fields */}
        <div className="grid gap-4 py-4">
          {/* Row 1: Name and Type */}
          <div className="grid grid-cols-2 gap-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="John Smith"
              />
            </div>

            {/* Type Field */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {INVESTOR_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {INVESTOR_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Firm and Stage */}
          <div className="grid grid-cols-2 gap-4">
            {/* Firm Field */}
            <div className="space-y-2">
              <Label htmlFor="firm">Firm / Company</Label>
              <Input
                id="firm"
                value={formData.firm}
                onChange={(e) => handleChange('firm', e.target.value)}
                placeholder="Sequoia Capital"
              />
            </div>

            {/* Stage Field */}
            <div className="space-y-2">
              <Label htmlFor="stage">Pipeline Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => handleChange('stage', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {INVESTOR_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {INVESTOR_STAGE_LABELS[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Email and Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="john@sequoia.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Row 4: LinkedIn and Twitter */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedInUrl">LinkedIn URL</Label>
              <Input
                id="linkedInUrl"
                value={formData.linkedInUrl}
                onChange={(e) => handleChange('linkedInUrl', e.target.value)}
                placeholder="https://linkedin.com/in/johnsmith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitterHandle">Twitter Handle</Label>
              <Input
                id="twitterHandle"
                value={formData.twitterHandle}
                onChange={(e) => handleChange('twitterHandle', e.target.value)}
                placeholder="@johnsmith"
              />
            </div>
          </div>

          {/* Row 5: Website and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://sequoia.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority || ''}
                onValueChange={(value) => handleChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 6: Source and Referred By */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => handleChange('source', e.target.value)}
                placeholder="Warm intro, Conference, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referredBy">Referred By</Label>
              <Input
                id="referredBy"
                value={formData.referredBy}
                onChange={(e) => handleChange('referredBy', e.target.value)}
                placeholder="Name of person who introduced"
              />
            </div>
          </div>

          {/* Row 7: Notes (full width) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional notes about this investor..."
              rows={3}
            />
          </div>
        </div>

        {/* Dialog Footer with Action Buttons */}
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
                {/* Simple loading spinner */}
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : isEditMode ? (
              'Save Changes'
            ) : (
              'Add Investor'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
