/**
 * Notes Types & Schemas
 *
 * This file defines all data structures for the Notes feature.
 *
 * WHAT IS THE NOTES FEATURE?
 * - A place to write and store text notes
 * - Supports Markdown formatting
 * - Great for meeting notes, ideas, research, etc.
 *
 * KEY CONCEPTS:
 * - Note: A text document with title and content
 * - Markdown: A simple formatting syntax (like **bold** or # heading)
 * - Pinned: Important notes that stay at the top
 */

import { z } from 'zod'

// ========================================
// NOTE TYPES
// ========================================

/**
 * Categories for organizing notes.
 */
export type NoteCategory =
  | 'general'
  | 'meeting'
  | 'idea'
  | 'research'
  | 'todo'
  | 'personal'

export const NOTE_CATEGORIES: NoteCategory[] = [
  'general',
  'meeting',
  'idea',
  'research',
  'todo',
  'personal',
]

export const NOTE_CATEGORY_LABELS: Record<NoteCategory, string> = {
  general: 'General',
  meeting: 'Meeting Notes',
  idea: 'Ideas',
  research: 'Research',
  todo: 'To-Do',
  personal: 'Personal',
}

export const NOTE_CATEGORY_ICONS: Record<NoteCategory, string> = {
  general: '📝',
  meeting: '🤝',
  idea: '💡',
  research: '🔬',
  todo: '✅',
  personal: '👤',
}

export const NOTE_CATEGORY_COLORS: Record<NoteCategory, string> = {
  general: 'bg-slate-100 text-slate-700',
  meeting: 'bg-blue-100 text-blue-700',
  idea: 'bg-amber-100 text-amber-700',
  research: 'bg-purple-100 text-purple-700',
  todo: 'bg-green-100 text-green-700',
  personal: 'bg-pink-100 text-pink-700',
}

// ========================================
// NOTE INTERFACE
// ========================================

/**
 * Represents a note.
 */
export interface Note {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** Note title */
  title: string

  /**
   * Note content in Markdown format.
   *
   * WHAT IS MARKDOWN?
   * - A lightweight markup language
   * - **bold**, *italic*, # headings, - lists
   * - Easy to write, renders nicely
   */
  content: string

  /** Category for organization */
  category: NoteCategory

  /** Is this note pinned to the top? */
  isPinned: boolean

  /** Is this note archived? */
  isArchived: boolean

  /** Tags for searching/filtering */
  tags: string[]

  /** Optional folder ID */
  folderId?: string

  /** Related investor ID (for investor meeting notes) */
  investorId?: string

  /** Related meeting ID */
  meetingId?: string

  /** Who created this note */
  createdBy: string
  createdByName?: string

  /** Last editor */
  lastEditedBy?: string
  lastEditedByName?: string

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

// ========================================
// NOTE FOLDER INTERFACE
// ========================================

/**
 * Represents a folder for organizing notes.
 */
export interface NoteFolder {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** Folder name */
  name: string

  /** Parent folder ID (for nested folders) */
  parentId?: string

  /** Folder color */
  color?: string

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

/**
 * Schema for creating a note.
 */
export const createNoteSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or less'),

  content: z.string().max(100000, 'Content is too long').default(''),

  category: z
    .enum(NOTE_CATEGORIES as [NoteCategory, ...NoteCategory[]])
    .default('general'),

  isPinned: z.boolean().default(false),

  tags: z.array(z.string()).default([]),

  folderId: z.string().optional(),

  investorId: z.string().optional(),

  meetingId: z.string().optional(),
})

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(500).optional(),

  content: z.string().max(100000).optional(),

  category: z.enum(NOTE_CATEGORIES as [NoteCategory, ...NoteCategory[]]).optional(),

  isPinned: z.boolean().optional(),

  isArchived: z.boolean().optional(),

  tags: z.array(z.string()).optional(),

  folderId: z.string().nullable().optional(),
})

/**
 * Schema for creating a note folder.
 */
export const createNoteFolderSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),

  parentId: z.string().optional(),

  color: z.string().optional(),
})

export const updateNoteFolderSchema = createNoteFolderSchema.partial()

// ========================================
// TYPE INFERENCE
// ========================================

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
export type CreateNoteFolderInput = z.infer<typeof createNoteFolderSchema>
export type UpdateNoteFolderInput = z.infer<typeof updateNoteFolderSchema>

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Extract a preview from note content.
 *
 * @param content - Full note content
 * @param maxLength - Maximum preview length
 * @returns Truncated preview text
 */
export function getNotePreview(content: string, maxLength = 150): string {
  // Strip markdown formatting for preview
  const stripped = content
    .replace(/#{1,6}\s/g, '') // Remove headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .replace(/`([^`]+)`/g, '$1') // Remove code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/[-*+]\s/g, '') // Remove list markers
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim()

  if (stripped.length <= maxLength) {
    return stripped
  }

  return stripped.substring(0, maxLength).trim() + '...'
}

/**
 * Calculate word count for note content.
 *
 * @param content - Note content
 * @returns Number of words
 */
export function getWordCount(content: string): number {
  return content
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length
}

/**
 * Calculate reading time for note content.
 *
 * @param content - Note content
 * @returns Reading time in minutes
 */
export function getReadingTime(content: string): number {
  const words = getWordCount(content)
  const wordsPerMinute = 200
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

/**
 * Sort notes with pinned first.
 *
 * @param notes - Array of notes
 * @returns Sorted array
 */
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    // Pinned notes first
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    // Then by updated date
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

/**
 * Group notes by category.
 *
 * @param notes - Array of notes
 * @returns Object with categories as keys
 */
export function groupNotesByCategory(notes: Note[]): Record<NoteCategory, Note[]> {
  const grouped: Record<NoteCategory, Note[]> = {
    general: [],
    meeting: [],
    idea: [],
    research: [],
    todo: [],
    personal: [],
  }

  notes.forEach((note) => {
    grouped[note.category].push(note)
  })

  return grouped
}
