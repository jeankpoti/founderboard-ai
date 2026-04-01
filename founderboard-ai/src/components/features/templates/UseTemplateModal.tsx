'use client'

/**
 * UseTemplateModal Component
 *
 * Modal for using a template to generate content.
 * Features:
 * - Dynamic form based on template variables
 * - Live preview of generated content
 * - Copy to clipboard or create note
 *
 * HOW IT WORKS:
 * 1. User selects a template
 * 2. Modal shows form fields for each variable
 * 3. User fills in the values
 * 4. Content is generated with values applied
 * 5. User can copy or save as a new note
 */

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, FileText, Check, Eye, FormInput } from 'lucide-react'
import { createNote } from '@/lib/actions/notes'
import { incrementTemplateUsage } from '@/lib/actions/templates'
import type { Template, TemplateVariable } from '@/types/templates'
import { applyVariables, variableNameToLabel } from '@/types/templates'

// ========================================
// TYPES
// ========================================

interface UseTemplateModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** The template to use */
  template: Template
}

// ========================================
// VARIABLE FIELD COMPONENT
// ========================================

interface VariableFieldProps {
  variable: TemplateVariable
  value: string
  onChange: (value: string) => void
}

/**
 * Renders an input field based on variable type.
 *
 * Different variable types get different inputs:
 * - text: Standard text input
 * - textarea: Multi-line text area
 * - date: Date picker
 * - number: Number input
 * - select: Dropdown with options
 */
function VariableField({ variable, value, onChange }: VariableFieldProps) {
  const id = `var-${variable.name}`
  const label = variable.label || variableNameToLabel(variable.name)

  switch (variable.type) {
    case 'textarea':
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>
            {label}
            {variable.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={variable.placeholder || `Enter ${label.toLowerCase()}...`}
            rows={3}
            required={variable.required}
          />
        </div>
      )

    case 'date':
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>
            {label}
            {variable.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={id}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={variable.required}
          />
        </div>
      )

    case 'number':
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>
            {label}
            {variable.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={id}
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={variable.placeholder || '0'}
            required={variable.required}
          />
        </div>
      )

    case 'select':
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>
            {label}
            {variable.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required={variable.required}
          >
            <option value="">Select {label.toLowerCase()}...</option>
            {variable.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )

    default: // text
      return (
        <div className="space-y-2">
          <Label htmlFor={id}>
            {label}
            {variable.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={variable.placeholder || `Enter ${label.toLowerCase()}...`}
            required={variable.required}
          />
        </div>
      )
  }
}

// ========================================
// MAIN COMPONENT
// ========================================

export function UseTemplateModal({
  open,
  onOpenChange,
  template,
}: UseTemplateModalProps) {
  const router = useRouter()

  // Variable values state
  const [values, setValues] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form')
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Initialize values with defaults when modal opens.
   */
  useEffect(() => {
    if (open) {
      const initialValues: Record<string, string> = {}
      template.variables.forEach((v) => {
        initialValues[v.name] = v.defaultValue || ''
      })
      setValues(initialValues)
      setActiveTab('form')
      setCopied(false)
      setError(null)
    }
  }, [open, template])

  /**
   * Update a single variable value.
   */
  const handleValueChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  /**
   * Generate the final content with variables applied.
   */
  const generatedContent = useMemo(() => {
    return applyVariables(template.content, values)
  }, [template.content, values])

  /**
   * Check if all required fields are filled.
   */
  const isValid = useMemo(() => {
    return template.variables
      .filter((v) => v.required)
      .every((v) => values[v.name]?.trim())
  }, [template.variables, values])

  /**
   * Copy generated content to clipboard.
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent)
      setCopied(true)

      // Track usage
      await incrementTemplateUsage(template.id)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  /**
   * Save generated content as a new note.
   */
  const handleSaveAsNote = async () => {
    setIsSaving(true)
    setError(null)

    try {
      // Create note from generated content
      const result = await createNote({
        title: template.name,
        content: generatedContent,
        category: 'general',
        isPinned: false,
        tags: [...(template.tags || []), 'from-template'],
      })

      if (!result.success) {
        setError(result.error.message)
        return
      }

      // Track usage
      await incrementTemplateUsage(template.id)

      // Close modal and navigate to notes
      onOpenChange(false)
      router.push('/notes')
    } catch (err) {
      console.error('Failed to save note:', err)
      setError('Failed to save as note.')
    } finally {
      setIsSaving(false)
    }
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Use Template: {template.name}</DialogTitle>
          <DialogDescription>
            {template.description || 'Fill in the fields below to generate content.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'form' | 'preview')}>
          <TabsList className="mb-4">
            <TabsTrigger value="form" className="flex items-center gap-1">
              <FormInput className="h-4 w-4" />
              Fill In
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          {/* Form Tab */}
          <TabsContent value="form" className="space-y-4">
            {template.variables.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                This template has no variables. Click Preview to see the content.
              </p>
            ) : (
              <div className="space-y-4">
                {template.variables.map((variable) => (
                  <VariableField
                    key={variable.name}
                    variable={variable}
                    value={values[variable.name] || ''}
                    onChange={(value) => handleValueChange(variable.name, value)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <div className="border rounded-md bg-muted/30 p-4 min-h-[200px] max-h-[400px] overflow-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {generatedContent}
              </pre>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Unfilled variables will appear as {'{{variable_name}}'}.
            </p>
          </TabsContent>
        </Tabs>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            disabled={!isValid}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy to Clipboard
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={handleSaveAsNote}
            disabled={!isValid || isSaving}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save as Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
