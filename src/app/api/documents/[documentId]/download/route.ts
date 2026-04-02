import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from 'firebase-admin/storage'
import { verifySession } from '@/lib/auth/session'
import { getOrgContext } from '@/lib/auth/org-context'
import { adminDb, getFirebaseAdminApp, getAdminStorageBucketName } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'

function buildContentDisposition(filename: string, disposition: 'attachment' | 'inline'): string {
  const asciiFilename = filename.replace(/[^\x20-\x7E]+/g, '_').replace(/"/g, '')
  const encodedFilename = encodeURIComponent(filename)

  return `${disposition}; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ documentId: string }> }
) {
  try {
    const { user } = await verifySession()
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' } },
        { status: 401 }
      )
    }

    const orgContext = await getOrgContext()
    if (!orgContext) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'No organization selected' } },
        { status: 401 }
      )
    }

    const { documentId } = await context.params
    const db = adminDb()
    const documentSnapshot = await db.collection(COLLECTIONS.DOCUMENTS).doc(documentId).get()

    if (!documentSnapshot.exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } },
        { status: 404 }
      )
    }

    const document = documentSnapshot.data()!
    if (document.orgId !== orgContext.organization.id) {
      return NextResponse.json(
        { success: false, error: { code: 'PERMISSION_DENIED', message: 'Access denied' } },
        { status: 403 }
      )
    }

    const bucketName = getAdminStorageBucketName()
    if (!bucketName) {
      throw new Error(
        'Firebase Storage bucket is not configured. Set FIREBASE_STORAGE_BUCKET or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.'
      )
    }

    const app = getFirebaseAdminApp()
    const storage = getStorage(app)
    const bucket = storage.bucket(bucketName)
    const fileRef = bucket.file(document.storagePath)
    const [exists] = await fileRef.exists()

    if (!exists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Stored file not found' } },
        { status: 404 }
      )
    }

    const [fileBuffer] = await fileRef.download()
    const requestedDisposition = request.nextUrl.searchParams.get('disposition')
    const disposition = requestedDisposition === 'inline' ? 'inline' : 'attachment'

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': document.mimeType || 'application/octet-stream',
        'Content-Length': String(fileBuffer.length),
        'Content-Disposition': buildContentDisposition(document.name, disposition),
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Document download error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Download failed' } },
      { status: 500 }
    )
  }
}
