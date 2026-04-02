'use server'

/**
 * Roadmap Server Actions
 *
 * Server-side functions for managing the product roadmap.
 *
 * WHAT IS A PRODUCT ROADMAP?
 * A roadmap visualizes your product plans over time.
 * It shows what features you're building, when they'll
 * be ready, and how they connect to milestones.
 */

import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { getOrgContext } from '@/lib/auth/org-context'
import {
  createRoadmapItemSchema,
  updateRoadmapItemSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
} from '@/types/roadmap'
import type { ApiResponse } from '@/types/api'
import type {
  RoadmapItem,
  RoadmapMilestone,
  CreateRoadmapItemInput,
  UpdateRoadmapItemInput,
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from '@/types/roadmap'
import { logActivity } from './activity'

// ========================================
// ROADMAP ITEMS
// ========================================

/**
 * Get all roadmap items for the organization.
 */
export async function getRoadmapItems(): Promise<ApiResponse<RoadmapItem[]>> {
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
      .collection(COLLECTIONS.ROADMAP_ITEMS)
      .where('orgId', '==', orgContext.organization.id)
      .orderBy('startDate', 'asc')
      .get()

    const items = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      }
    }) as RoadmapItem[]

    return { success: true, data: items }
  } catch (error) {
    console.error('Get roadmap items error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch roadmap items' },
    }
  }
}

/**
 * Get a single roadmap item by ID.
 */
export async function getRoadmapItem(itemId: string): Promise<ApiResponse<RoadmapItem>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    const doc = await db.collection(COLLECTIONS.ROADMAP_ITEMS).doc(itemId).get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Roadmap item not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const item: RoadmapItem = {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as RoadmapItem

    return { success: true, data: item }
  } catch (error) {
    console.error('Get roadmap item error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch roadmap item' },
    }
  }
}

/**
 * Create a new roadmap item.
 */
export async function createRoadmapItem(
  input: CreateRoadmapItemInput
): Promise<ApiResponse<RoadmapItem>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    // Viewers cannot create roadmap items
    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot create roadmap items' },
      }
    }

    // Validate input
    const validation = createRoadmapItemSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0]?.message || 'Invalid input',
        },
      }
    }

    // Validate dates
    if (new Date(validation.data.endDate) < new Date(validation.data.startDate)) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'End date must be after start date' },
      }
    }

    const db = adminDb()
    const now = new Date().toISOString()

    // Get creator name
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(orgContext.user.uid).get()
    const createdByName = userDoc.exists ? userDoc.data()?.displayName : undefined

    // Create roadmap item
    const itemRef = db.collection(COLLECTIONS.ROADMAP_ITEMS).doc()
    const itemData: Omit<RoadmapItem, 'id'> = {
      orgId: orgContext.organization.id,
      ...validation.data,
      createdBy: orgContext.user.uid,
      createdByName,
      createdAt: now,
      updatedAt: now,
    }

    await itemRef.set(itemData)

    // Log activity
    await logActivity({
      type: 'roadmap_item_created',
      targetType: 'roadmap_item',
      targetId: itemRef.id,
      targetName: validation.data.title,
    })

    return {
      success: true,
      data: { id: itemRef.id, ...itemData },
    }
  } catch (error) {
    console.error('Create roadmap item error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create roadmap item' },
    }
  }
}

/**
 * Update a roadmap item.
 */
export async function updateRoadmapItem(
  itemId: string,
  input: UpdateRoadmapItemInput
): Promise<ApiResponse<RoadmapItem>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot update roadmap items' },
      }
    }

    // Validate input
    const validation = updateRoadmapItemSchema.safeParse(input)
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
    const itemRef = db.collection(COLLECTIONS.ROADMAP_ITEMS).doc(itemId)
    const doc = await itemRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Roadmap item not found' },
      }
    }

    const existingData = doc.data()!
    if (existingData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Build update data, converting null milestoneId to undefined
    const { milestoneId, ...restData } = validation.data
    const updateData: Partial<RoadmapItem> = {
      ...restData,
      ...(milestoneId !== undefined && { milestoneId: milestoneId || undefined }),
      updatedAt: new Date().toISOString(),
    }

    await itemRef.update(updateData)

    // Log activity
    await logActivity({
      type: 'roadmap_item_updated',
      targetType: 'roadmap_item',
      targetId: itemId,
      targetName: validation.data.title || existingData.title,
    })

    const updatedItem: RoadmapItem = {
      ...existingData,
      ...updateData,
      id: itemId,
      createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt,
    } as RoadmapItem

    return { success: true, data: updatedItem }
  } catch (error) {
    console.error('Update roadmap item error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update roadmap item' },
    }
  }
}

/**
 * Delete a roadmap item.
 */
export async function deleteRoadmapItem(itemId: string): Promise<ApiResponse<void>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can delete roadmap items' },
      }
    }

    const db = adminDb()
    const itemRef = db.collection(COLLECTIONS.ROADMAP_ITEMS).doc(itemId)
    const doc = await itemRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Roadmap item not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    await itemRef.delete()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete roadmap item error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete roadmap item' },
    }
  }
}

// ========================================
// MILESTONES
// ========================================

/**
 * Get all milestones for the organization.
 */
export async function getMilestones(): Promise<ApiResponse<RoadmapMilestone[]>> {
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
      .collection(COLLECTIONS.ROADMAP_MILESTONES)
      .where('orgId', '==', orgContext.organization.id)
      .orderBy('targetDate', 'asc')
      .get()

    const milestones = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        completedAt: data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
      }
    }) as RoadmapMilestone[]

    return { success: true, data: milestones }
  } catch (error) {
    console.error('Get milestones error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch milestones' },
    }
  }
}

/**
 * Create a new milestone.
 */
export async function createMilestone(
  input: CreateMilestoneInput
): Promise<ApiResponse<RoadmapMilestone>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot create milestones' },
      }
    }

    // Validate input
    const validation = createMilestoneSchema.safeParse(input)
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

    // Create milestone
    const milestoneRef = db.collection(COLLECTIONS.ROADMAP_MILESTONES).doc()
    const milestoneData: Omit<RoadmapMilestone, 'id'> = {
      orgId: orgContext.organization.id,
      ...validation.data,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    }

    await milestoneRef.set(milestoneData)

    return {
      success: true,
      data: { id: milestoneRef.id, ...milestoneData },
    }
  } catch (error) {
    console.error('Create milestone error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create milestone' },
    }
  }
}

/**
 * Update a milestone.
 */
export async function updateMilestone(
  milestoneId: string,
  input: UpdateMilestoneInput
): Promise<ApiResponse<RoadmapMilestone>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot update milestones' },
      }
    }

    // Validate input
    const validation = updateMilestoneSchema.safeParse(input)
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
    const milestoneRef = db.collection(COLLECTIONS.ROADMAP_MILESTONES).doc(milestoneId)
    const doc = await milestoneRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Milestone not found' },
      }
    }

    const existingData = doc.data()!
    if (existingData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const now = new Date().toISOString()

    // Build update data
    const updateData: Partial<RoadmapMilestone> = {
      ...validation.data,
      updatedAt: now,
    }

    // If marking as completed, set completedAt
    if (validation.data.isCompleted && !existingData.isCompleted) {
      updateData.completedAt = now

      // Log milestone reached activity
      await logActivity({
        type: 'milestone_reached',
        targetType: 'milestone',
        targetId: milestoneId,
        targetName: existingData.name,
      })
    }

    await milestoneRef.update(updateData)

    const updatedMilestone: RoadmapMilestone = {
      ...existingData,
      ...updateData,
      id: milestoneId,
      createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt,
    } as RoadmapMilestone

    return { success: true, data: updatedMilestone }
  } catch (error) {
    console.error('Update milestone error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update milestone' },
    }
  }
}

/**
 * Delete a milestone.
 */
export async function deleteMilestone(milestoneId: string): Promise<ApiResponse<void>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can delete milestones' },
      }
    }

    const db = adminDb()
    const milestoneRef = db.collection(COLLECTIONS.ROADMAP_MILESTONES).doc(milestoneId)
    const doc = await milestoneRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Milestone not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    await milestoneRef.delete()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete milestone error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete milestone' },
    }
  }
}
