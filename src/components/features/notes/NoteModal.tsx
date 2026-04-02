'use client'

/**
 * NoteModal Component
 *
 * Modal dialog for creating and editing notes.
 * Features:
 * - Title and content input
 * - Category selection
 * - Tag management
 * - Markdown preview toggle
 *
 * WHAT IS A MODAL?
 * A modal is a popup dialog that appears over the main content.
 * It focuses user attention on a specific task (like creating a note).
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Eye, Edit3, Hash } from 'lucide-react'
import { createNote, updateNote } from '@/lib/actions/notes'
import type { Note, NoteCategory, CreateNoteInput, UpdateNoteInput } from '@/types/notes'
import {
  NOTE_CATEGORIES,
  NOTE_CATEGORY_LABELS,
  NOTE_CATEGORY_ICONS,
  getWordCount,
  getReadingTime,
} from '@/types/notes'

// ========================================
// TYPES
// ========================================

interface NoteModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Existing note to edit (undefined for new note) */
  note?: Note
  /** Callback when note is saved successfully */
  onSuccess: () => void
}

// ========================================
// MARKDOWN PREVIEW COMPONENT
// ========================================

/**
 * Simple markdown preview.
 *
 * HOW IT WORKS:
 * - Takes raw markdown text
 * - Applies basic formatting rules
 * - Renders as styled HTML
 *
 * NOTE: This is a simple implementation.
 * For production, consider using a library like react-markdown.
 */
function MarkdownPreview({ content }: { content: string }) {
  /**
   * Convert markdown to simple HTML.
   *
   * SUPPORTED SYNTAX:
   * - # Heading 1, ## Heading 2, etc.
   * - **bold**, *italic*
   * - `inline code`
   * - - list items
   * - [links](url)
   */
  const formatMarkdown = (text: string): string => {
    if (!text) return '<p class="text-muted-foreground">No content</p>'

    let html = text
      // Escape HTML first (security)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headings
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      // Bold and italic
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      // Lists
      .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-primary underline" target="_blank" rel="noopener">$1</a>'
      )
      // Line breaks (double newline = paragraph)
      .replace(/\n\n/g, '</p><p class="mb-2">')
      // Single newlines
      .replace(/\n/g, '<br />')

    return `<p class="mb-2">${html}</p>`
  }

  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none min-h-[200px] p-3 border rounded-md bg-muted/30"
      dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
    />
  )
}

// ========================================
// MAIN COMPONENT
// ========================================

export function NoteModal({ open, onOpenChange, note, onSuccess }: NoteModalProps) {
  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<NoteCategory>('general')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPinned, setIsPinned] = useState(false)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  /**
   * Initialize form when note changes.
   *
   * WHY useEffect?
   * When editing an existing note, we need to populate
   * the form with the note's current values.
   */
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setCategory(note.category)
      setTags(note.tags || [])
      setIsPinned(note.isPinned)
    } else {
      // Reset form for new note
      setTitle('')
      setContent('')
      setCategory('general')
      setTags([])
      setIsPinned(false)
    }
    setError(null)
    setActiveTab('edit')
  }, [note, open])

  /**
   * Handle adding a tag.
   *
   * Tags help organize notes and make them searchable.
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
   * Enter or comma adds the tag.
   */
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag()
    }
  }

  /**
   * Handle form submission.
   *
   * Creates a new note or updates an existing one.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (note) {
        // Update existing note
        const input: UpdateNoteInput = {
          title,
          content,
          category,
          tags,
          isPinned,
        }

        const result = await updateNote(note.id, input)
        if (!result.success) {
          setError(result.error.message)
          return
        }
      } else {
        // Create new note
        const input: CreateNoteInput = {
          title,
          content,
          category,
          tags,
          isPinned,
        }

        const result = await createNote(input)
        if (!result.success) {
          setError(result.error.message)
          return
        }
      }

      // Success - close modal and notify parent
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Save note error:', err)
      setError('An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate content statistics
  const wordCount = getWordCount(content)
  const readingTime = getReadingTime(content)

  // ========================================
  // RENDER
  // ========================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit Note' : 'Create Note'}</DialogTitle>
          <DialogDescription>
            {note
              ? 'Make changes to your note below.'
              : 'Write your thoughts, ideas, or meeting notes.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
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
              placeholder="Give your note a title..."
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as NoteCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {NOTE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {NOTE_CATEGORY_ICONS[cat]} {NOTE_CATEGORY_LABELS[cat]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content with Edit/Preview Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Content</Label>
              <div className="text-xs text-muted-foreground">
                {wordCount} words · {readingTime} min read
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
              <TabsList className="mb-2">
                <TabsTrigger value="edit" className="flex items-center gap-1">
                  <Edit3 className="h-3 w-3" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="mt-0">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your note here... (Markdown supported)"
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supports Markdown: **bold**, *italic*, # headings, - lists, [links](url)
                </p>
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <MarkdownPreview content={content} />
              </TabsContent>
            </Tabs>
          </div>

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
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    #{tag}
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

          {/* Pin Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isPinned" className="font-normal cursor-pointer">
              Pin this note to the top
            </Label>
          </div>

          {/* Actions */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? 'Saving...' : note ? 'Save Changes' : 'Create Note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
