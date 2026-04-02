'use server'

/**
 * Documents Server Actions
 *
 * Server-side functions for managing documents.
 * Handles CRUD operations for documents and folders.
 *
 * NOTE: Actual file uploads are handled by a separate API route
 * because server actions have size limits. This file handles
 * the metadata stored in Firestore.
 */

import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { getOrgContext } from '@/lib/auth/org-context'
import {
  createDocumentSchema,
  updateDocumentSchema,
  createFolderSchema,
  updateFolderSchema,
} from '@/types/documents'
import type { ApiResponse } from '@/types/api'
import type {
  Document,
  DocumentFolder,
  CreateDocumentInput,
  UpdateDocumentInput,
  CreateFolderInput,
  UpdateFolderInput,
} from '@/types/documents'
import { logActivity } from './activity'

// ========================================
// DOCUMENTS
// ========================================

/**
 * Get all documents for the organization.
 */
export async function getDocuments(): Promise<ApiResponse<Document[]>> {
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
      .collection(COLLECTIONS.DOCUMENTS)
      .where('orgId', '==', orgContext.organization.id)
      .orderBy('createdAt', 'desc')
      .get()

    const documents = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      }
    }) as Document[]

    return { success: true, data: documents }
  } catch (error) {
    console.error('Get documents error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch documents' },
    }
  }
}

/**
 * Get a single document by ID.
 */
export async function getDocument(documentId: string): Promise<ApiResponse<Document>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    const doc = await db.collection(COLLECTIONS.DOCUMENTS).doc(documentId).get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const document: Document = {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as Document

    return { success: true, data: document }
  } catch (error) {
    console.error('Get document error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch document' },
    }
  }
}

/**
 * Create a document record.
 *
 * This is called after a file has been successfully uploaded to Storage.
 * It creates the metadata record in Firestore.
 */
export async function createDocument(
  input: CreateDocumentInput
): Promise<ApiResponse<Document>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot upload documents' },
      }
    }

    const validation = createDocumentSchema.safeParse(input)
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

    // Get uploader name
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(orgContext.user.uid).get()
    const uploadedByName = userDoc.exists ? userDoc.data()?.displayName : undefined

    const documentRef = db.collection(COLLECTIONS.DOCUMENTS).doc()
    const documentData: Omit<Document, 'id'> = {
      orgId: orgContext.organization.id,
      ...validation.data,
      version: 1,
      sharedWith: [],
      uploadedBy: orgContext.user.uid,
      uploadedByName,
      createdAt: now,
      updatedAt: now,
    }

    await documentRef.set(documentData)

    // Log activity
    await logActivity({
      type: 'document_uploaded',
      targetType: 'document',
      targetId: documentRef.id,
      targetName: validation.data.name,
    })

    return {
      success: true,
      data: { id: documentRef.id, ...documentData },
    }
  } catch (error) {
    console.error('Create document error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create document' },
    }
  }
}

/**
 * Update a document's metadata.
 */
export async function updateDocument(
  documentId: string,
  input: UpdateDocumentInput
): Promise<ApiResponse<Document>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot update documents' },
      }
    }

    const validation = updateDocumentSchema.safeParse(input)
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
    const documentRef = db.collection(COLLECTIONS.DOCUMENTS).doc(documentId)
    const doc = await documentRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      }
    }

    const existingData = doc.data()!
    if (existingData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const updateData = {
      ...validation.data,
      updatedAt: new Date().toISOString(),
    }

    await documentRef.update(updateData)

    const updatedDocument: Document = {
      ...existingData,
      ...updateData,
      id: documentId,
      createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt,
    } as Document

    return { success: true, data: updatedDocument }
  } catch (error) {
    console.error('Update document error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update document' },
    }
  }
}

/**
 * Delete a document.
 *
 * Note: This deletes the Firestore record. The actual file in Storage
 * should be deleted separately (handled by the API route).
 */
export async function deleteDocument(documentId: string): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    // Only admins and owners can delete
    if (orgContext.role !== 'owner' && orgContext.role !== 'admin') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can delete documents' },
      }
    }

    const db = adminDb()
    const documentRef = db.collection(COLLECTIONS.DOCUMENTS).doc(documentId)
    const doc = await documentRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    await documentRef.delete()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete document error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete document' },
    }
  }
}

// ========================================
// FOLDERS
// ========================================

/**
 * Get all folders for the organization.
 */
export async function getFolders(): Promise<ApiResponse<DocumentFolder[]>> {
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
      .collection(COLLECTIONS.DOCUMENT_FOLDERS)
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
    }) as DocumentFolder[]

    return { success: true, data: folders }
  } catch (error) {
    console.error('Get folders error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch folders' },
    }
  }
}

/**
 * Create a new folder.
 */
export async function createFolder(
  input: CreateFolderInput
): Promise<ApiResponse<DocumentFolder>> {
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

    const validation = createFolderSchema.safeParse(input)
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

    const folderRef = db.collection(COLLECTIONS.DOCUMENT_FOLDERS).doc()
    const folderData: Omit<DocumentFolder, 'id'> = {
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
    console.error('Create folder error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create folder' },
    }
  }
}

/**
 * Update a folder.
 */
export async function updateFolder(
  folderId: string,
  input: UpdateFolderInput
): Promise<ApiResponse<DocumentFolder>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot update folders' },
      }
    }

    const validation = updateFolderSchema.safeParse(input)
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
    const folderRef = db.collection(COLLECTIONS.DOCUMENT_FOLDERS).doc(folderId)
    const doc = await folderRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Folder not found' },
      }
    }

    const existingData = doc.data()!
    if (existingData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const updateData = {
      ...validation.data,
      updatedAt: new Date().toISOString(),
    }

    await folderRef.update(updateData)

    const updatedFolder: DocumentFolder = {
      ...existingData,
      ...updateData,
      id: folderId,
      createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt,
    } as DocumentFolder

    return { success: true, data: updatedFolder }
  } catch (error) {
    console.error('Update folder error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update folder' },
    }
  }
}

/**
 * Delete a folder.
 *
 * Note: Documents in the folder are not deleted, just unassigned.
 */
export async function deleteFolder(folderId: string): Promise<ApiResponse<void>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can delete folders' },
      }
    }

    const db = adminDb()
    const folderRef = db.collection(COLLECTIONS.DOCUMENT_FOLDERS).doc(folderId)
    const doc = await folderRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Folder not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Move documents out of this folder (set folderId to null)
    const documentsSnapshot = await db
      .collection(COLLECTIONS.DOCUMENTS)
      .where('folderId', '==', folderId)
      .get()

    const batch = db.batch()
    documentsSnapshot.docs.forEach((docRef) => {
      batch.update(docRef.ref, { folderId: null, updatedAt: new Date().toISOString() })
    })
    batch.delete(folderRef)
    await batch.commit()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete folder error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete folder' },
    }
  }
}

/**
 * Get documents in a specific folder.
 */
export async function getDocumentsInFolder(
  folderId: string | null
): Promise<ApiResponse<Document[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    let query = db
      .collection(COLLECTIONS.DOCUMENTS)
      .where('orgId', '==', orgContext.organization.id)

    if (folderId) {
      query = query.where('folderId', '==', folderId)
    } else {
      // Get documents without a folder (root level)
      query = query.where('folderId', '==', null)
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get()

    const documents = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      }
    }) as Document[]

    return { success: true, data: documents }
  } catch (error) {
    console.error('Get documents in folder error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch documents' },
    }
  }
}
