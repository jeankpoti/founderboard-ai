'use server'

/**
 * Notes Server Actions
 *
 * Server-side functions for managing notes.
 * Handles CRUD operations for notes and note folders.
 */

import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { getOrgContext } from '@/lib/auth/org-context'
import {
  createNoteSchema,
  updateNoteSchema,
  createNoteFolderSchema,
  updateNoteFolderSchema,
} from '@/types/notes'
import type { ApiResponse } from '@/types/api'
import type {
  Note,
  NoteFolder,
  CreateNoteInput,
  UpdateNoteInput,
  CreateNoteFolderInput,
  UpdateNoteFolderInput,
} from '@/types/notes'
import { logActivity } from './activity'

// ========================================
// NOTES
// ========================================

/**
 * Get all notes for the organization.
 */
export async function getNotes(): Promise<ApiResponse<Note[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    const snapshot = await db
      .collection(COLLECTIONS.NOTES)
      .where('orgId', '==', orgContext.organization.id)
      .where('isArchived', '==', false)
      .orderBy('updatedAt', 'desc')
      .get()

    const notes = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      }
    }) as Note[]

    return { success: true, data: notes }
  } catch (error) {
    console.error('Get notes error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch notes' },
    }
  }
}

/**
 * Get a single note by ID.
 */
export async function getNote(noteId: string): Promise<ApiResponse<Note>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    const doc = await db.collection(COLLECTIONS.NOTES).doc(noteId).get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Note not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const note: Note = {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as Note

    return { success: true, data: note }
  } catch (error) {
    console.error('Get note error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch note' },
    }
  }
}

/**
 * Create a new note.
 */
export async function createNote(
  input: CreateNoteInput
): Promise<ApiResponse<Note>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot create notes' },
      }
    }

    const validation = createNoteSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0]?.message || 'Invalid input',
        },
      }
    }

    const db = adminDb()
    const now = new Date().toISOString()

    // Get creator name
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(orgContext.user.uid).get()
    const createdByName = userDoc.exists ? userDoc.data()?.displayName : undefined

    const noteRef = db.collection(COLLECTIONS.NOTES).doc()
    const noteData: Omit<Note, 'id'> = {
      orgId: orgContext.organization.id,
      ...validation.data,
      isArchived: false,
      createdBy: orgContext.user.uid,
      createdByName,
      createdAt: now,
      updatedAt: now,
    }

    await noteRef.set(noteData)

    // Log activity
    await logActivity({
      type: 'note_created',
      targetType: 'note',
      targetId: noteRef.id,
      targetName: validation.data.title,
    })

    return {
      success: true,
      data: { id: noteRef.id, ...noteData },
    }
  } catch (error) {
    console.error('Create note error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create note' },
    }
  }
}

/**
 * Update a note.
 */
export async function updateNote(
  noteId: string,
  input: UpdateNoteInput
): Promise<ApiResponse<Note>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot update notes' },
      }
    }

    const validation = updateNoteSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0]?.message || 'Invalid input',
        },
      }
    }

    const db = adminDb()
    const noteRef = db.collection(COLLECTIONS.NOTES).doc(noteId)
    const doc = await noteRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Note not found' },
      }
    }

    const existingData = doc.data()!
    if (existingData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Get editor name
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(orgContext.user.uid).get()
    const lastEditedByName = userDoc.exists ? userDoc.data()?.displayName : undefined

    const updateData: Partial<Note> = {
      ...validation.data,
      lastEditedBy: orgContext.user.uid,
      lastEditedByName,
      updatedAt: new Date().toISOString(),
    }

    await noteRef.update(updateData)

    // Log activity
    await logActivity({
      type: 'note_updated',
      targetType: 'note',
      targetId: noteId,
      targetName: validation.data.title || existingData.title,
    })

    const updatedNote: Note = {
      ...existingData,
      ...updateData,
      id: noteId,
      createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt,
    } as Note

    return { success: true, data: updatedNote }
  } catch (error) {
    console.error('Update note error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update note' },
    }
  }
}

/**
 * Delete a note (or archive it).
 */
export async function deleteNote(noteId: string): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role !== 'owner' && orgContext.role !== 'admin') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can delete notes' },
      }
    }

    const db = adminDb()
    const noteRef = db.collection(COLLECTIONS.NOTES).doc(noteId)
    const doc = await noteRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Note not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Actually delete (or archive)
    await noteRef.delete()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete note error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete note' },
    }
  }
}

/**
 * Toggle note pinned status.
 */
export async function toggleNotePin(noteId: string): Promise<ApiResponse<Note>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot pin notes' },
      }
    }

    const db = adminDb()
    const noteRef = db.collection(COLLECTIONS.NOTES).doc(noteId)
    const doc = await noteRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Note not found' },
      }
    }

    const existingData = doc.data()!
    if (existingData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const newPinnedStatus = !existingData.isPinned
    await noteRef.update({
      isPinned: newPinnedStatus,
      updatedAt: new Date().toISOString(),
    })

    const updatedNote: Note = {
      ...existingData,
      isPinned: newPinnedStatus,
      id: noteId,
      createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt,
      updatedAt: new Date().toISOString(),
    } as Note

    return { success: true, data: updatedNote }
  } catch (error) {
    console.error('Toggle pin error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to toggle pin' },
    }
  }
}

// ========================================
// NOTE FOLDERS
// ========================================

/**
 * Get all note folders.
 */
export async function getNoteFolders(): Promise<ApiResponse<NoteFolder[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    const snapshot = await db
      .collection(COLLECTIONS.NOTE_FOLDERS)
      .where('orgId', '==', orgContext.organization.id)
      .orderBy('name', 'asc')
      .get()

    const folders = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      }
    }) as NoteFolder[]

    return { success: true, data: folders }
  } catch (error) {
    console.error('Get note folders error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch folders' },
    }
  }
}

/**
 * Create a note folder.
 */
export async function createNoteFolder(
  input: CreateNoteFolderInput
): Promise<ApiResponse<NoteFolder>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot create folders' },
      }
    }

    const validation = createNoteFolderSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0]?.message || 'Invalid input',
        },
      }
    }

    const db = adminDb()
    const now = new Date().toISOString()

    const folderRef = db.collection(COLLECTIONS.NOTE_FOLDERS).doc()
    const folderData: Omit<NoteFolder, 'id'> = {
      orgId: orgContext.organization.id,
      ...validation.data,
      createdAt: now,
      updatedAt: now,
    }

    await folderRef.set(folderData)

    return {
      success: true,
      data: { id: folderRef.id, ...folderData },
    }
  } catch (error) {
    console.error('Create note folder error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create folder' },
    }
  }
}
