'use server'

/**
 * OKRs Server Actions
 *
 * Server-side functions for managing OKRs (Objectives and Key Results).
 * Handles CRUD operations for objectives, key results, and check-ins.
 */

import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { getOrgContext } from '@/lib/auth/org-context'
import {
  createObjectiveSchema,
  updateObjectiveSchema,
  createKeyResultSchema,
  updateKeyResultSchema,
  createCheckInSchema,
  calculateKeyResultProgress,
  calculateObjectiveProgress,
} from '@/types/okrs'
import type { ApiResponse } from '@/types/api'
import type {
  Objective,
  KeyResult,
  KeyResultCheckIn,
  CreateObjectiveInput,
  UpdateObjectiveInput,
  CreateKeyResultInput,
  UpdateKeyResultInput,
  CreateCheckInInput,
} from '@/types/okrs'
import { logActivity } from './activity'

// ========================================
// UTILITIES
// ========================================

/**
 * Remove undefined values from an object.
 * Firestore doesn't accept undefined values, so we filter them out.
 */
function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T
}

// ========================================
// OBJECTIVES
// ========================================

/**
 * Get all objectives for the organization.
 */
export async function getObjectives(): Promise<ApiResponse<Objective[]>> {
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
      .collection(COLLECTIONS.OBJECTIVES)
      .where('orgId', '==', orgContext.organization.id)
      .orderBy('year', 'desc')
      .orderBy('period', 'desc')
      .orderBy('order', 'asc')
      .get()

    const objectives = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      }
    }) as Objective[]

    return { success: true, data: objectives }
  } catch (error) {
    console.error('Get objectives error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch objectives' },
    }
  }
}

/**
 * Get a single objective by ID.
 */
export async function getObjective(
  objectiveId: string
): Promise<ApiResponse<Objective>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    const doc = await db.collection(COLLECTIONS.OBJECTIVES).doc(objectiveId).get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Objective not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const objective: Objective = {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as Objective

    return { success: true, data: objective }
  } catch (error) {
    console.error('Get objective error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch objective' },
    }
  }
}

/**
 * Create a new objective.
 */
export async function createObjective(
  input: CreateObjectiveInput
): Promise<ApiResponse<Objective>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot create objectives' },
      }
    }

    const validation = createObjectiveSchema.safeParse(input)
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

    // Get max order for this period
    const maxOrderSnapshot = await db
      .collection(COLLECTIONS.OBJECTIVES)
      .where('orgId', '==', orgContext.organization.id)
      .where('year', '==', validation.data.year)
      .where('period', '==', validation.data.period)
      .orderBy('order', 'desc')
      .limit(1)
      .get()

    const maxOrder = maxOrderSnapshot.empty
      ? 0
      : (maxOrderSnapshot.docs[0].data().order || 0) + 1

    // Get owner name if ownerId provided
    let ownerName: string | undefined
    if (validation.data.ownerId) {
      const userDoc = await db
        .collection(COLLECTIONS.USERS)
        .doc(validation.data.ownerId)
        .get()
      if (userDoc.exists) {
        ownerName = userDoc.data()?.displayName
      }
    }

    const objectiveRef = db.collection(COLLECTIONS.OBJECTIVES).doc()
    const objectiveData: Omit<Objective, 'id'> = {
      orgId: orgContext.organization.id,
      ...validation.data,
      ownerName,
      progress: 0, // Will be calculated from key results
      order: maxOrder,
      createdBy: orgContext.user.uid,
      createdAt: now,
      updatedAt: now,
    }

    await objectiveRef.set(removeUndefined(objectiveData))

    // Log activity
    await logActivity({
      type: 'objective_created',
      targetType: 'objective',
      targetId: objectiveRef.id,
      targetName: validation.data.title,
    })

    return {
      success: true,
      data: { id: objectiveRef.id, ...objectiveData },
    }
  } catch (error) {
    console.error('Create objective error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create objective' },
    }
  }
}

/**
 * Update an objective.
 */
export async function updateObjective(
  objectiveId: string,
  input: UpdateObjectiveInput
): Promise<ApiResponse<Objective>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot update objectives' },
      }
    }

    const validation = updateObjectiveSchema.safeParse(input)
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
    const objectiveRef = db.collection(COLLECTIONS.OBJECTIVES).doc(objectiveId)
    const doc = await objectiveRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Objective not found' },
      }
    }

    const existingData = doc.data()!
    if (existingData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Members can only update their own objectives
    if (
      orgContext.role === 'member' &&
      existingData.ownerId !== orgContext.user.uid
    ) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'You can only update your own objectives' },
      }
    }

    const updateData: Partial<Objective> = {
      ...validation.data,
      updatedAt: new Date().toISOString(),
    }

    // Update owner name if ownerId changed
    if (validation.data.ownerId) {
      const userDoc = await db
        .collection(COLLECTIONS.USERS)
        .doc(validation.data.ownerId)
        .get()
      if (userDoc.exists) {
        updateData.ownerName = userDoc.data()?.displayName
      }
    }

    await objectiveRef.update(removeUndefined(updateData))

    // Log activity
    await logActivity({
      type: 'objective_updated',
      targetType: 'objective',
      targetId: objectiveId,
      targetName: validation.data.title || existingData.title,
    })

    const updatedObjective: Objective = {
      ...existingData,
      ...updateData,
      id: objectiveId,
      createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt,
    } as Objective

    return { success: true, data: updatedObjective }
  } catch (error) {
    console.error('Update objective error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update objective' },
    }
  }
}

/**
 * Delete an objective and all its key results.
 */
export async function deleteObjective(objectiveId: string): Promise<ApiResponse<void>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can delete objectives' },
      }
    }

    const db = adminDb()
    const objectiveRef = db.collection(COLLECTIONS.OBJECTIVES).doc(objectiveId)
    const doc = await objectiveRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Objective not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Delete all key results for this objective
    const keyResultsSnapshot = await db
      .collection(COLLECTIONS.KEY_RESULTS)
      .where('objectiveId', '==', objectiveId)
      .get()

    const batch = db.batch()
    keyResultsSnapshot.docs.forEach((krDoc) => {
      batch.delete(krDoc.ref)
    })
    batch.delete(objectiveRef)
    await batch.commit()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete objective error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete objective' },
    }
  }
}

// ========================================
// KEY RESULTS
// ========================================

/**
 * Get all key results for an objective.
 */
export async function getKeyResults(
  objectiveId: string
): Promise<ApiResponse<KeyResult[]>> {
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
      .collection(COLLECTIONS.KEY_RESULTS)
      .where('orgId', '==', orgContext.organization.id)
      .where('objectiveId', '==', objectiveId)
      .orderBy('order', 'asc')
      .get()

    const keyResults = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      }
    }) as KeyResult[]

    return { success: true, data: keyResults }
  } catch (error) {
    console.error('Get key results error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch key results' },
    }
  }
}

/**
 * Create a new key result.
 */
export async function createKeyResult(
  input: CreateKeyResultInput
): Promise<ApiResponse<KeyResult>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot create key results' },
      }
    }

    const validation = createKeyResultSchema.safeParse(input)
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

    // Verify objective exists and belongs to this org
    const objectiveDoc = await db
      .collection(COLLECTIONS.OBJECTIVES)
      .doc(validation.data.objectiveId)
      .get()

    if (!objectiveDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Objective not found' },
      }
    }

    if (objectiveDoc.data()!.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Get max order
    const maxOrderSnapshot = await db
      .collection(COLLECTIONS.KEY_RESULTS)
      .where('objectiveId', '==', validation.data.objectiveId)
      .orderBy('order', 'desc')
      .limit(1)
      .get()

    const maxOrder = maxOrderSnapshot.empty
      ? 0
      : (maxOrderSnapshot.docs[0].data().order || 0) + 1

    // Calculate initial progress
    const progress = calculateKeyResultProgress(
      validation.data.currentValue || 0,
      validation.data.startValue,
      validation.data.targetValue,
      validation.data.metricType
    )

    // Get owner name
    let ownerName: string | undefined
    if (validation.data.ownerId) {
      const userDoc = await db
        .collection(COLLECTIONS.USERS)
        .doc(validation.data.ownerId)
        .get()
      if (userDoc.exists) {
        ownerName = userDoc.data()?.displayName
      }
    }

    const keyResultRef = db.collection(COLLECTIONS.KEY_RESULTS).doc()
    const keyResultData: Omit<KeyResult, 'id'> = {
      orgId: orgContext.organization.id,
      ...validation.data,
      currentValue: validation.data.currentValue || validation.data.startValue,
      progress,
      ownerName,
      order: maxOrder,
      createdAt: now,
      updatedAt: now,
    }

    await keyResultRef.set(removeUndefined(keyResultData))

    // Update objective progress
    await updateObjectiveProgressFromKeyResults(validation.data.objectiveId)

    return {
      success: true,
      data: { id: keyResultRef.id, ...keyResultData },
    }
  } catch (error) {
    console.error('Create key result error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create key result' },
    }
  }
}

/**
 * Update a key result.
 */
export async function updateKeyResult(
  keyResultId: string,
  input: UpdateKeyResultInput
): Promise<ApiResponse<KeyResult>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot update key results' },
      }
    }

    const validation = updateKeyResultSchema.safeParse(input)
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
    const keyResultRef = db.collection(COLLECTIONS.KEY_RESULTS).doc(keyResultId)
    const doc = await keyResultRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Key result not found' },
      }
    }

    const existingData = doc.data()!
    if (existingData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Calculate new progress if values changed
    const currentValue = validation.data.currentValue ?? existingData.currentValue
    const startValue = validation.data.startValue ?? existingData.startValue
    const targetValue = validation.data.targetValue ?? existingData.targetValue
    const metricType = validation.data.metricType ?? existingData.metricType

    const progress = calculateKeyResultProgress(
      currentValue,
      startValue,
      targetValue,
      metricType
    )

    const updateData: Partial<KeyResult> = {
      ...validation.data,
      progress,
      updatedAt: new Date().toISOString(),
    }

    await keyResultRef.update(removeUndefined(updateData))

    // Update objective progress
    await updateObjectiveProgressFromKeyResults(existingData.objectiveId)

    // Log activity if value changed significantly
    if (
      validation.data.currentValue !== undefined &&
      validation.data.currentValue !== existingData.currentValue
    ) {
      await logActivity({
        type: 'key_result_updated',
        targetType: 'key_result',
        targetId: keyResultId,
        targetName: existingData.title,
        metadata: {
          previousValue: existingData.currentValue,
          newValue: validation.data.currentValue,
          progress,
        },
      })
    }

    const updatedKeyResult: KeyResult = {
      ...existingData,
      ...updateData,
      id: keyResultId,
      createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt,
    } as KeyResult

    return { success: true, data: updatedKeyResult }
  } catch (error) {
    console.error('Update key result error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update key result' },
    }
  }
}

/**
 * Delete a key result.
 */
export async function deleteKeyResult(keyResultId: string): Promise<ApiResponse<void>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can delete key results' },
      }
    }

    const db = adminDb()
    const keyResultRef = db.collection(COLLECTIONS.KEY_RESULTS).doc(keyResultId)
    const doc = await keyResultRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Key result not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const objectiveId = data.objectiveId
    await keyResultRef.delete()

    // Update objective progress
    await updateObjectiveProgressFromKeyResults(objectiveId)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete key result error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete key result' },
    }
  }
}

/**
 * Update objective progress based on its key results.
 */
async function updateObjectiveProgressFromKeyResults(objectiveId: string): Promise<void> {
  const db = adminDb()

  // Get all key results for this objective
  const keyResultsSnapshot = await db
    .collection(COLLECTIONS.KEY_RESULTS)
    .where('objectiveId', '==', objectiveId)
    .get()

  const keyResults = keyResultsSnapshot.docs.map((doc) => doc.data() as KeyResult)
  const progress = calculateObjectiveProgress(keyResults)

  // Update objective
  await db.collection(COLLECTIONS.OBJECTIVES).doc(objectiveId).update({
    progress,
    updatedAt: new Date().toISOString(),
  })
}

// ========================================
// CHECK-INS
// ========================================

/**
 * Create a check-in for a key result.
 */
export async function createCheckIn(
  input: CreateCheckInInput
): Promise<ApiResponse<KeyResultCheckIn>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot create check-ins' },
      }
    }

    const validation = createCheckInSchema.safeParse(input)
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

    // Get the key result
    const keyResultDoc = await db
      .collection(COLLECTIONS.KEY_RESULTS)
      .doc(validation.data.keyResultId)
      .get()

    if (!keyResultDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Key result not found' },
      }
    }

    const keyResultData = keyResultDoc.data()!
    if (keyResultData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const now = new Date().toISOString()

    // Get user name
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(orgContext.user.uid).get()
    const createdByName = userDoc.exists ? userDoc.data()?.displayName : undefined

    // Create check-in
    const checkInRef = db.collection(COLLECTIONS.KEY_RESULT_CHECK_INS).doc()
    const checkInData: Omit<KeyResultCheckIn, 'id'> = {
      orgId: orgContext.organization.id,
      keyResultId: validation.data.keyResultId,
      value: validation.data.value,
      previousValue: keyResultData.currentValue,
      notes: validation.data.notes,
      createdBy: orgContext.user.uid,
      createdByName,
      createdAt: now,
    }

    await checkInRef.set(removeUndefined(checkInData))

    // Update key result with new value
    const progress = calculateKeyResultProgress(
      validation.data.value,
      keyResultData.startValue,
      keyResultData.targetValue,
      keyResultData.metricType
    )

    await db.collection(COLLECTIONS.KEY_RESULTS).doc(validation.data.keyResultId).update({
      currentValue: validation.data.value,
      progress,
      updatedAt: now,
    })

    // Update objective progress
    await updateObjectiveProgressFromKeyResults(keyResultData.objectiveId)

    // Log activity
    await logActivity({
      type: 'key_result_updated',
      targetType: 'key_result',
      targetId: validation.data.keyResultId,
      targetName: keyResultData.title,
      metadata: {
        previousValue: keyResultData.currentValue,
        newValue: validation.data.value,
        progress,
      },
    })

    return {
      success: true,
      data: { id: checkInRef.id, ...checkInData },
    }
  } catch (error) {
    console.error('Create check-in error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create check-in' },
    }
  }
}
