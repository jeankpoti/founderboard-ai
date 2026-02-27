/**
 * Documents Types & Schemas
 *
 * This file defines all data structures for the Documents feature.
 *
 * WHAT IS THE DOCUMENTS FEATURE?
 * - A place to store and organize important files
 * - Examples: Pitch decks, financial models, contracts, term sheets
 * - Think of it like Google Drive but built into your startup dashboard
 *
 * KEY CONCEPTS:
 * - Document: A file you upload (PDF, PowerPoint, etc.)
 * - Folder: A way to organize documents
 * - Sharing: Control who can see each document
 * - Versions: Track different versions of the same document
 */

import { z } from 'zod'

// ========================================
// DOCUMENT TYPES
// ========================================

/**
 * What type of document is this?
 *
 * These categories help organize documents:
 * - pitch_deck: Your investor presentation
 * - one_pager: Single-page company overview
 * - financial_model: Spreadsheet with projections
 * - contract: Legal agreements
 * - term_sheet: Investment term sheets
 * - report: Reports and analyses
 * - other: Anything else
 */
export type DocumentType =
  | 'pitch_deck'
  | 'one_pager'
  | 'financial_model'
  | 'contract'
  | 'term_sheet'
  | 'report'
  | 'image'
  | 'other'

export const DOCUMENT_TYPES: DocumentType[] = [
  'pitch_deck',
  'one_pager',
  'financial_model',
  'contract',
  'term_sheet',
  'report',
  'image',
  'other',
]

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  pitch_deck: 'Pitch Deck',
  one_pager: 'One Pager',
  financial_model: 'Financial Model',
  contract: 'Contract',
  term_sheet: 'Term Sheet',
  report: 'Report',
  image: 'Image',
  other: 'Other',
}

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  pitch_deck: '📊',
  one_pager: '📄',
  financial_model: '📈',
  contract: '📝',
  term_sheet: '📋',
  report: '📑',
  image: '🖼️',
  other: '📁',
}

// ========================================
// DOCUMENT INTERFACE
// ========================================

/**
 * Represents a document in the library.
 *
 * Documents store metadata about uploaded files.
 * The actual file is stored in Firebase Storage.
 */
export interface Document {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** File name (e.g., "Pitch Deck v2.pdf") */
  name: string

  /** Type of document for categorization */
  type: DocumentType

  /** Description or notes about the document */
  description?: string

  /**
   * URL to the file in Firebase Storage
   *
   * This is a signed URL that allows downloading the file.
   * It may expire, so we regenerate it when needed.
   */
  fileUrl: string

  /**
   * Storage path in Firebase Storage
   *
   * Example: "orgs/abc123/documents/xyz789.pdf"
   * Used to generate download URLs and delete files.
   */
  storagePath: string

  /** File size in bytes */
  fileSize: number

  /**
   * MIME type of the file
   *
   * WHAT IS MIME TYPE?
   * - A standard way to identify file types
   * - Examples: "application/pdf", "image/png", "application/vnd.ms-powerpoint"
   * - Used by browsers to know how to handle the file
   */
  mimeType: string

  /** Original file extension (e.g., "pdf", "pptx") */
  fileExtension: string

  /** Optional folder ID for organization */
  folderId?: string

  /** Tags for searching/filtering */
  tags: string[]

  /**
   * Version number
   *
   * When you upload a new version, this increments.
   * Helps track document history.
   */
  version: number

  /**
   * User IDs who have access (besides org members)
   *
   * For sharing with specific people outside the org.
   */
  sharedWith: string[]

  /** Is this document publicly accessible? */
  isPublic: boolean

  /** User who uploaded this */
  uploadedBy: string
  uploadedByName?: string

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

// ========================================
// FOLDER INTERFACE
// ========================================

/**
 * Represents a folder for organizing documents.
 */
export interface DocumentFolder {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** Folder name */
  name: string

  /** Parent folder ID (for nested folders) */
  parentId?: string

  /** Folder color for visual organization */
  color?: string

  /** Description */
  description?: string

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

/**
 * Schema for creating a document record.
 *
 * Note: This validates the metadata, not the actual file upload.
 * File uploads are handled separately by the upload API.
 */
export const createDocumentSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less'),

  type: z.enum(DOCUMENT_TYPES as [DocumentType, ...DocumentType[]]),

  description: z.string().max(2000).optional(),

  fileUrl: z.string().url('Invalid file URL'),

  storagePath: z.string().min(1, 'Storage path is required'),

  fileSize: z.number().min(0),

  mimeType: z.string().min(1, 'MIME type is required'),

  fileExtension: z.string().min(1),

  folderId: z.string().optional(),

  tags: z.array(z.string()).default([]),

  isPublic: z.boolean().default(false),
})

export const updateDocumentSchema = z.object({
  name: z.string().min(1).max(255).optional(),

  type: z.enum(DOCUMENT_TYPES as [DocumentType, ...DocumentType[]]).optional(),

  description: z.string().max(2000).optional(),

  folderId: z.string().nullable().optional(),

  tags: z.array(z.string()).optional(),

  isPublic: z.boolean().optional(),
})

/**
 * Schema for creating a folder.
 */
export const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),

  parentId: z.string().optional(),

  color: z.string().optional(),

  description: z.string().max(500).optional(),
})

export const updateFolderSchema = createFolderSchema.partial()

// ========================================
// TYPE INFERENCE
// ========================================

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>
export type CreateFolderInput = z.infer<typeof createFolderSchema>
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Format file size for display.
 *
 * @param bytes - File size in bytes
 * @returns Human-readable string like "1.5 MB"
 *
 * EXAMPLE:
 * formatFileSize(1500000) → "1.43 MB"
 * formatFileSize(500) → "500 B"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`
}

/**
 * Get file extension from filename.
 *
 * @param filename - The filename
 * @returns Extension without dot (e.g., "pdf")
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ''
}

/**
 * Determine document type from MIME type.
 *
 * @param mimeType - The file's MIME type
 * @param filename - The filename (used as fallback)
 * @returns Best-guess document type
 */
export function getDocumentTypeFromMime(
  mimeType: string,
  filename: string
): DocumentType {
  // Check for common presentation formats
  if (
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint') ||
    filename.endsWith('.pptx') ||
    filename.endsWith('.ppt') ||
    filename.endsWith('.key')
  ) {
    return 'pitch_deck'
  }

  // Check for spreadsheets
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    filename.endsWith('.xlsx') ||
    filename.endsWith('.xls')
  ) {
    return 'financial_model'
  }

  // Check for images
  if (mimeType.startsWith('image/')) {
    return 'image'
  }

  // Default to 'other' for PDFs and unknown types
  return 'other'
}

/**
 * Check if a file type is allowed.
 *
 * @param mimeType - The file's MIME type
 * @returns true if the file type is allowed
 */
export function isAllowedFileType(mimeType: string): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ]

  return allowedTypes.includes(mimeType) || mimeType.startsWith('image/')
}

/**
 * Get maximum file size in bytes.
 *
 * @returns Max file size (10 MB)
 */
export function getMaxFileSize(): number {
  return 10 * 1024 * 1024 // 10 MB
}

/**
 * Group documents by folder.
 *
 * @param documents - Array of documents
 * @returns Object with folder IDs as keys
 */
export function groupDocumentsByFolder(
  documents: Document[]
): Record<string, Document[]> {
  const grouped: Record<string, Document[]> = {
    root: [], // Documents without a folder
  }

  documents.forEach((doc) => {
    const folderId = doc.folderId || 'root'
    if (!grouped[folderId]) {
      grouped[folderId] = []
    }
    grouped[folderId].push(doc)
  })

  return grouped
}

/**
 * Get icon for file type based on extension.
 *
 * @param extension - File extension
 * @returns Emoji icon
 */
export function getFileIcon(extension: string): string {
  const icons: Record<string, string> = {
    pdf: '📕',
    doc: '📘',
    docx: '📘',
    xls: '📗',
    xlsx: '📗',
    ppt: '📙',
    pptx: '📙',
    key: '📙',
    txt: '📄',
    csv: '📊',
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    gif: '🖼️',
    webp: '🖼️',
  }

  return icons[extension.toLowerCase()] || '📁'
}
