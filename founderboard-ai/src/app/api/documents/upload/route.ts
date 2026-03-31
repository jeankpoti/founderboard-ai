/**
 * Document Upload API Route
 *
 * Handles file uploads for the Documents feature.
 *
 * WHY USE AN API ROUTE INSTEAD OF SERVER ACTION?
 * - Server Actions have a size limit (4MB by default)
 * - API routes can handle larger files
 * - Better for streaming/progress tracking
 *
 * HOW FILE UPLOADS WORK:
 * 1. Client sends file as FormData
 * 2. We validate the file (size, type)
 * 3. Upload to Firebase Storage
 * 4. Create document record in Firestore
 * 5. Return the created document
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from 'firebase-admin/storage'
import { adminDb, getFirebaseAdminApp, getAdminStorageBucketName } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { verifySession } from '@/lib/auth/session'
import { getOrgContext } from '@/lib/auth/org-context'
import {
  isAllowedFileType,
  getMaxFileSize,
  getFileExtension,
  getDocumentTypeFromMime,
} from '@/types/documents'
import type { Document } from '@/types/documents'

/**
 * POST /api/documents/upload
 *
 * Upload a new document.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user } = await verifySession()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    // Get organization context
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'No organization selected' } },
        { status: 401 }
      )
    }

    // Check permissions
    if (orgContext.role === 'viewer') {
      return NextResponse.json(
        { success: false, error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot upload documents' } },
        { status: 403 }
      )
    }

    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folderId = formData.get('folderId') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No file provided' } },
        { status: 400 }
      )
    }

    // Validate file type
    if (!isAllowedFileType(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'File type not allowed' } },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > getMaxFileSize()) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'File size exceeds 10MB limit' } },
        { status: 400 }
      )
    }

    // Generate storage path
    const fileExtension = getFileExtension(file.name)
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const storagePath = `orgs/${orgContext.organization.id}/documents/${timestamp}-${randomId}.${fileExtension}`

    // Upload to Firebase Storage
    const app = getFirebaseAdminApp()
    const storage = getStorage(app)
    const bucketName = getAdminStorageBucketName()

    if (!bucketName) {
      throw new Error(
        'Firebase Storage bucket is not configured. Set FIREBASE_STORAGE_BUCKET or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.'
      )
    }

    const bucket = storage.bucket(bucketName)
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    const fileRef = bucket.file(storagePath)
    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedBy: user.uid,
          orgId: orgContext.organization.id,
        },
      },
    })

    // Make the file publicly accessible (or use signed URLs)
    await fileRef.makePublic()
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`

    // Create document record in Firestore
    const db = adminDb()
    const now = new Date().toISOString()

    // Get uploader name
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.uid).get()
    const uploadedByName = userDoc.exists ? userDoc.data()?.displayName : undefined

    const documentRef = db.collection(COLLECTIONS.DOCUMENTS).doc()
    const documentData: Omit<Document, 'id'> = {
      orgId: orgContext.organization.id,
      name: file.name,
      type: getDocumentTypeFromMime(file.type, file.name),
      fileUrl: publicUrl,
      storagePath,
      fileSize: file.size,
      mimeType: file.type,
      fileExtension,
      tags: [],
      version: 1,
      sharedWith: [],
      isPublic: false,
      uploadedBy: user.uid,
      uploadedByName,
      createdAt: now,
      updatedAt: now,
    }

    if (folderId) {
      documentData.folderId = folderId
    }

    await documentRef.set(documentData)

    const createdDocument: Document = {
      id: documentRef.id,
      ...documentData,
    }

    return NextResponse.json({ success: true, data: createdDocument })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Upload failed' } },
      { status: 500 }
    )
  }
}
