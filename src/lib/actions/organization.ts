'use server'

import { cookies } from 'next/headers'
import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { verifySession } from '@/lib/auth/session'
import { createOrganizationSchema } from '@/lib/validations/organization'
import { generateUniqueSlug } from '@/lib/utils/slug'
import type { ApiResponse } from '@/types/api'

const CURRENT_ORG_COOKIE = 'currentOrgId'

interface CreateOrgResult {
  orgId: string
  slug: string
}

export async function createOrganization(
  input: { name: string }
): Promise<ApiResponse<CreateOrgResult>> {
  try {
    // Verify user is authenticated
    const { user, error: sessionError } = await verifySession()
    if (!user) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: sessionError || 'Not authenticated' },
      }
    }

    // Validate input
    const validation = createOrganizationSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0]?.message || 'Invalid input',
        },
      }
    }

    const { name } = validation.data
    const db = adminDb()
    const batch = db.batch()

    // Generate unique slug
    const slug = generateUniqueSlug(name)

    // Create organization document
    const orgRef = db.collection(COLLECTIONS.ORGANIZATIONS).doc()
    const orgId = orgRef.id
    const now = new Date()

    batch.set(orgRef, {
      id: orgId,
      name,
      slug,
      ownerId: user.uid,
      createdAt: now,
      updatedAt: now,
    })

    // Create membership document (owner)
    const membershipId = `${user.uid}_${orgId}`
    const membershipRef = db.collection(COLLECTIONS.MEMBERSHIPS).doc(membershipId)

    batch.set(membershipRef, {
      id: membershipId,
      userId: user.uid,
      orgId,
      role: 'owner',
      joinedAt: now,
    })

    // Update user document with linked org
    const userRef = db.collection(COLLECTIONS.USERS).doc(user.uid)
    batch.update(userRef, {
      linkedOrgIds: [...(user.linkedOrgIds || []), orgId],
      updatedAt: now,
    })

    // Commit all changes
    await batch.commit()

    return {
      success: true,
      data: { orgId, slug },
    }
  } catch (error) {
    console.error('Create organization error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create organization' },
    }
  }
}

/**
 * Switch to a different organization
 */
export async function switchOrganization(
  orgId: string
): Promise<ApiResponse<{ orgId: string }>> {
  try {
    const { user, error: sessionError } = await verifySession()
    if (!user) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: sessionError || 'Not authenticated' },
      }
    }

    // Verify user has access to this org
    if (!user.linkedOrgIds?.includes(orgId)) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'You do not have access to this organization' },
      }
    }

    // Verify org exists
    const db = adminDb()
    const orgDoc = await db.collection(COLLECTIONS.ORGANIZATIONS).doc(orgId).get()

    if (!orgDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Organization not found' },
      }
    }

    // Set the current org cookie
    const cookieStore = await cookies()
    cookieStore.set(CURRENT_ORG_COOKIE, orgId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return {
      success: true,
      data: { orgId },
    }
  } catch (error) {
    console.error('Switch organization error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to switch organization' },
    }
  }
}
