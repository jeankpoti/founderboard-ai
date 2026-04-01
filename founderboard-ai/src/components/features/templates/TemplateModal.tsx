'use client'

/**
 * TemplateModal Component
 *
 * Modal for creating and editing templates.
 * Features:
 * - Name and description input
 * - Category and output type selection
 * - Content editor with variable highlighting
 * - Variable configuration
 *
 * HOW TEMPLATE VARIABLES WORK:
 * - Use {{variable_name}} syntax in content
 * - Variables are automatically detected
 * - Users can configure variable types and defaults
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { X, Variable, Hash } from 'lucide-react'
import { createTemplate, updateTemplate } from '@/lib/actions/templates'
import type {
  Template,
  TemplateCategory,
  TemplateOutputType,
  CreateTemplateInput,
  UpdateTemplateInput,
} from '@/types/templates'
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_CATEGORY_ICONS,
  TEMPLATE_OUTPUT_TYPES,
  TEMPLATE_OUTPUT_LABELS,
  extractVariables,
} from '@/types/templates'

// ========================================
// TYPES
// ========================================

interface TemplateModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Existing template to edit (undefined for new template) */
  template?: Template
  /** Callback when template is saved successfully */
  onSuccess: () => void
}

// ========================================
// MAIN COMPONENT
// ========================================

export function TemplateModal({
  open,
  onOpenChange,
  template,
  onSuccess,
}: TemplateModalProps) {
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TemplateCategory>('custom')
  const [outputType, setOutputType] = useState<TemplateOutputType>('note')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Detected variables from content
  const detectedVariables = extractVariables(content)

  /**
   * Initialize form when template changes.
   */
  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description)
      setCategory(template.category)
      setOutputType(template.outputType)
      setContent(template.content)
      setTags(template.tags || [])
      setIsPublic(template.isPublic)
    } else {
      // Reset form for new template
      setName('')
      setDescription('')
      setCategory('custom')
      setOutputType('note')
      setContent('')
      setTags([])
      setIsPublic(true)
    }
    setError(null)
  }, [template, open])

  /**
   * Handle adding a tag.
   */
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  /**
   * Handle removing a tag.
   */
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  /**
   * Handle tag input key press.
   */
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag()
    }
  }

  /**
   * Handle form submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (template) {
        // Update existing template
        const input: UpdateTemplateInput = {
          name,
          description,
          category,
          outputType,
          content,
          tags,
          isPublic,
        }

        const result = await updateTemplate(template.id, input)
        if (!result.success) {
          setError(result.error.message)
          return
        }
      } else {
        // Create new template
        // Note: variables will be auto-extracted from content by the server action
        const input: CreateTemplateInput = {
          name,
          description,
          category,
          outputType,
          content,
          variables: [], // Will be populated from content on server
          tags,
          isPublic,
        }

        const result = await createTemplate(input)
        if (!result.success) {
          setError(result.error.message)
          return
        }
      }

      // Success
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Save template error:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'Create Template'}</DialogTitle>
          <DialogDescription>
            {template
              ? 'Make changes to your template.'
              : 'Create a reusable template for notes and documents.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Meeting Agenda"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this template is for..."
            />
          </div>

          {/* Category and Output Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {TEMPLATE_CATEGORY_ICONS[cat]} {TEMPLATE_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputType">Output Type</Label>
              <Select
                value={outputType}
                onValueChange={(v) => setOutputType(v as TemplateOutputType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_OUTPUT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {TEMPLATE_OUTPUT_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Template Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Write your template content here...

Use {{variable_name}} syntax for placeholders.

Example:
# Meeting with {{investor_name}}
Date: {{meeting_date}}
`}
              rows={12}
              className="font-mono text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              Use {'{{variable_name}}'} for placeholders that users fill in.
            </p>
          </div>

          {/* Detected Variables */}
          {detectedVariables.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Variable className="h-3 w-3" />
                Detected Variables
              </Label>
              <div className="flex flex-wrap gap-2">
                {detectedVariables.map((variable) => (
                  <Badge key={variable} variant="secondary" className="font-mono">
                    {'{{'}{variable}{'}}'}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                These placeholders will be replaced when the template is used.
              </p>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tags (press Enter)"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={handleAddTag} disabled={!tagInput.trim()}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isPublic" className="font-normal cursor-pointer">
              Share with team (visible to all organization members)
            </Label>
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim() || !content.trim()}>
              {isSubmitting ? 'Saving...' : template ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
