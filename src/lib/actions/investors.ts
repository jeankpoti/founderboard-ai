/**
 * Investor Server Actions
 *
 * This file handles all database operations for the Investor CRM.
 *
 * WHAT'S IN THIS FILE:
 * - CRUD operations for investors (Create, Read, Update, Delete)
 * - Meeting management
 * - Interaction logging
 * - Pipeline movement
 *
 * Each function follows the same pattern:
 * 1. Check authentication (getOrgContext)
 * 2. Validate input data (Zod schemas)
 * 3. Check permissions
 * 4. Perform database operation
 * 5. Return success or error
 */
'use server'

import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { getOrgContext } from '@/lib/auth/org-context'
import {
  createInvestorSchema,
  updateInvestorSchema,
  createMeetingSchema,
  updateMeetingSchema,
  createInteractionSchema,
} from '@/types/investors'
import type { ApiResponse } from '@/types/api'
import type {
  Investor,
  InvestorMeeting,
  InvestorInteraction,
  InvestorStage,
  CreateInvestorInput,
  UpdateInvestorInput,
  CreateMeetingInput,
  UpdateMeetingInput,
  CreateInteractionInput,
} from '@/types/investors'
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
// INVESTOR CRUD OPERATIONS
// ========================================

/**
 * Get all investors for the current organization.
 *
 * @returns Array of investors sorted by last update
 */
export async function getInvestors(): Promise<ApiResponse<Investor[]>> {
  try {
    // Step 1: Check authentication
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    // Step 2: Query the database
    const db = adminDb()
    const snapshot = await db
      .collection(COLLECTIONS.INVESTORS)
      .where('orgId', '==', orgContext.organization.id)
      .orderBy('updatedAt', 'desc')
      .get()

    // Step 3: Transform documents to our type
    const investors = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Ensure dates are strings
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      }
    }) as Investor[]

    return { success: true, data: investors }
  } catch (error) {
    console.error('Get investors error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch investors' },
    }
  }
}

/**
 * Get a single investor by ID.
 *
 * @param investorId - The investor's document ID
 * @returns The investor or an error
 */
export async function getInvestor(
  investorId: string
): Promise<ApiResponse<Investor>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    const db = adminDb()
    const doc = await db.collection(COLLECTIONS.INVESTORS).doc(investorId).get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Investor not found' },
      }
    }

    const data = doc.data()!

    // Verify this investor belongs to the user's org
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    return {
      success: true,
      data: {
        id: doc.id,
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      } as Investor,
    }
  } catch (error) {
    console.error('Get investor error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch investor' },
    }
  }
}

/**
 * Create a new investor.
 *
 * @param input - Investor data to create
 * @returns The created investor or an error
 */
export async function createInvestor(
  input: CreateInvestorInput
): Promise<ApiResponse<Investor>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    // Viewers cannot create investors
    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Viewers cannot add investors',
        },
      }
    }

    // Validate input
    const validation = createInvestorSchema.safeParse(input)
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

    // Get assignee name if assigned
    let assigneeName: string | undefined
    if (validation.data.assigneeId) {
      const userDoc = await db
        .collection(COLLECTIONS.USERS)
        .doc(validation.data.assigneeId)
        .get()
      if (userDoc.exists) {
        assigneeName = userDoc.data()?.displayName
      }
    }

    // Create the investor document
    const investorRef = db.collection(COLLECTIONS.INVESTORS).doc()
    const investorData: Omit<Investor, 'id'> = {
      orgId: orgContext.organization.id,
      name: validation.data.name,
      type: validation.data.type,
      firm: validation.data.firm,
      email: validation.data.email || undefined,
      phone: validation.data.phone,
      linkedInUrl: validation.data.linkedInUrl || undefined,
      twitterHandle: validation.data.twitterHandle,
      website: validation.data.website || undefined,
      stage: validation.data.stage || 'lead',
      checkSize: validation.data.checkSize,
      focusAreas: validation.data.focusAreas,
      investmentStages: validation.data.investmentStages,
      notes: validation.data.notes,
      assigneeId: validation.data.assigneeId,
      assigneeName,
      nextFollowUpAt: validation.data.nextFollowUpAt,
      source: validation.data.source,
      referredBy: validation.data.referredBy,
      priority: validation.data.priority,
      createdBy: orgContext.user.uid,
      createdAt: now,
      updatedAt: now,
    }

    await investorRef.set(removeUndefined(investorData))

    const createdInvestor = { id: investorRef.id, ...investorData } as Investor

    // Log the activity
    await logActivity({
      type: 'investor_added',
      targetType: 'investor',
      targetId: investorRef.id,
      targetName: validation.data.name,
      metadata: { firm: validation.data.firm, type: validation.data.type },
    })

    return { success: true, data: createdInvestor }
  } catch (error) {
    console.error('Create investor error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create investor' },
    }
  }
}

/**
 * Update an existing investor.
 *
 * @param investorId - ID of the investor to update
 * @param input - Fields to update
 * @returns The updated investor or an error
 */
export async function updateInvestor(
  investorId: string,
  input: UpdateInvestorInput
): Promise<ApiResponse<Investor>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Viewers cannot edit investors',
        },
      }
    }

    const validation = updateInvestorSchema.safeParse(input)
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
    const investorRef = db.collection(COLLECTIONS.INVESTORS).doc(investorId)
    const investorDoc = await investorRef.get()

    if (!investorDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Investor not found' },
      }
    }

    const existingInvestor = investorDoc.data() as Investor

    // Verify org ownership
    if (existingInvestor.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Build update data
    const updateData: Partial<Investor> = {
      updatedAt: new Date().toISOString(),
    }

    // Copy over all provided fields
    const data = validation.data
    if (data.name !== undefined) updateData.name = data.name
    if (data.type !== undefined) updateData.type = data.type
    if (data.firm !== undefined) updateData.firm = data.firm
    if (data.email !== undefined) updateData.email = data.email || undefined
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.linkedInUrl !== undefined)
      updateData.linkedInUrl = data.linkedInUrl || undefined
    if (data.twitterHandle !== undefined)
      updateData.twitterHandle = data.twitterHandle
    if (data.website !== undefined)
      updateData.website = data.website || undefined
    if (data.stage !== undefined) updateData.stage = data.stage
    if (data.checkSize !== undefined) updateData.checkSize = data.checkSize
    if (data.focusAreas !== undefined) updateData.focusAreas = data.focusAreas
    if (data.investmentStages !== undefined)
      updateData.investmentStages = data.investmentStages
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.nextFollowUpAt !== undefined)
      updateData.nextFollowUpAt = data.nextFollowUpAt
    if (data.source !== undefined) updateData.source = data.source
    if (data.referredBy !== undefined) updateData.referredBy = data.referredBy
    if (data.priority !== undefined) updateData.priority = data.priority

    // Handle assignee update
    if (data.assigneeId !== undefined) {
      updateData.assigneeId = data.assigneeId
      if (data.assigneeId) {
        const userDoc = await db
          .collection(COLLECTIONS.USERS)
          .doc(data.assigneeId)
          .get()
        updateData.assigneeName = userDoc.exists
          ? userDoc.data()?.displayName
          : undefined
      } else {
        updateData.assigneeName = undefined
      }
    }

    await investorRef.update(removeUndefined(updateData))

    // Log stage changes
    if (data.stage && data.stage !== existingInvestor.stage) {
      await logActivity({
        type: 'investor_stage_changed',
        targetType: 'investor',
        targetId: investorId,
        targetName: existingInvestor.name,
        metadata: {
          previousStage: existingInvestor.stage,
          newStage: data.stage,
        },
      })
    } else {
      await logActivity({
        type: 'investor_updated',
        targetType: 'investor',
        targetId: investorId,
        targetName: existingInvestor.name,
      })
    }

    return {
      success: true,
      data: { ...existingInvestor, ...updateData, id: investorId } as Investor,
    }
  } catch (error) {
    console.error('Update investor error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update investor' },
    }
  }
}

/**
 * Delete an investor.
 *
 * @param investorId - ID of the investor to delete
 * @returns Success or error
 */
export async function deleteInvestor(
  investorId: string
): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    // Only admins and owners can delete
    if (orgContext.role !== 'owner' && orgContext.role !== 'admin') {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Only admins can delete investors',
        },
      }
    }

    const db = adminDb()
    const investorRef = db.collection(COLLECTIONS.INVESTORS).doc(investorId)
    const investorDoc = await investorRef.get()

    if (!investorDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Investor not found' },
      }
    }

    const investor = investorDoc.data() as Investor

    if (investor.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Delete investor and related data in a batch
    const batch = db.batch()

    // Delete the investor
    batch.delete(investorRef)

    // Delete all meetings for this investor
    const meetingsSnapshot = await db
      .collection(COLLECTIONS.INVESTOR_MEETINGS)
      .where('investorId', '==', investorId)
      .get()
    meetingsSnapshot.docs.forEach((doc) => batch.delete(doc.ref))

    // Delete all interactions for this investor
    const interactionsSnapshot = await db
      .collection(COLLECTIONS.INVESTOR_INTERACTIONS)
      .where('investorId', '==', investorId)
      .get()
    interactionsSnapshot.docs.forEach((doc) => batch.delete(doc.ref))

    await batch.commit()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete investor error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete investor' },
    }
  }
}

/**
 * Move an investor to a different pipeline stage.
 *
 * This is a shorthand for updating just the stage,
 * commonly used in Kanban drag-and-drop.
 *
 * @param investorId - ID of the investor
 * @param newStage - The new pipeline stage
 * @returns The updated investor or an error
 */
export async function moveInvestorToStage(
  investorId: string,
  newStage: InvestorStage
): Promise<ApiResponse<Investor>> {
  return updateInvestor(investorId, { stage: newStage })
}

// ========================================
// MEETING OPERATIONS
// ========================================

/**
 * Get all meetings for an investor.
 *
 * @param investorId - ID of the investor
 * @returns Array of meetings
 */
export async function getInvestorMeetings(
  investorId: string
): Promise<ApiResponse<InvestorMeeting[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    const db = adminDb()

    // First verify the investor belongs to this org
    const investorDoc = await db
      .collection(COLLECTIONS.INVESTORS)
      .doc(investorId)
      .get()

    if (!investorDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Investor not found' },
      }
    }

    if (investorDoc.data()!.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Get meetings
    const snapshot = await db
      .collection(COLLECTIONS.INVESTOR_MEETINGS)
      .where('investorId', '==', investorId)
      .orderBy('scheduledAt', 'desc')
      .get()

    const meetings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InvestorMeeting[]

    return { success: true, data: meetings }
  } catch (error) {
    console.error('Get investor meetings error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch meetings' },
    }
  }
}

/**
 * Create a new meeting with an investor.
 *
 * @param input - Meeting data
 * @returns The created meeting or an error
 */
export async function createMeeting(
  input: CreateMeetingInput
): Promise<ApiResponse<InvestorMeeting>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Viewers cannot create meetings',
        },
      }
    }

    const validation = createMeetingSchema.safeParse(input)
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

    // Verify investor exists and belongs to org
    const investorDoc = await db
      .collection(COLLECTIONS.INVESTORS)
      .doc(validation.data.investorId)
      .get()

    if (!investorDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Investor not found' },
      }
    }

    const investor = investorDoc.data()!
    if (investor.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const now = new Date().toISOString()
    const meetingRef = db.collection(COLLECTIONS.INVESTOR_MEETINGS).doc()

    const meetingData: Omit<InvestorMeeting, 'id'> = {
      orgId: orgContext.organization.id,
      investorId: validation.data.investorId,
      title: validation.data.title,
      description: validation.data.description,
      meetingType: validation.data.meetingType,
      scheduledAt: validation.data.scheduledAt,
      duration: validation.data.duration || 60,
      location: validation.data.location,
      meetingUrl: validation.data.meetingUrl || undefined,
      attendees: validation.data.attendees,
      createdBy: orgContext.user.uid,
      createdAt: now,
      updatedAt: now,
    }

    await meetingRef.set(meetingData)

    // Update investor's stage to meeting_scheduled if currently earlier
    const stageOrder = ['lead', 'contacted']
    if (stageOrder.includes(investor.stage)) {
      await db
        .collection(COLLECTIONS.INVESTORS)
        .doc(validation.data.investorId)
        .update({
          stage: 'meeting_scheduled',
          updatedAt: now,
        })
    }

    // Update lastContactAt
    await db
      .collection(COLLECTIONS.INVESTORS)
      .doc(validation.data.investorId)
      .update({
        lastContactAt: now,
        updatedAt: now,
      })

    // Log activity
    await logActivity({
      type: 'meeting_scheduled',
      targetType: 'meeting',
      targetId: meetingRef.id,
      targetName: `${validation.data.title} with ${investor.name}`,
      metadata: {
        investorId: validation.data.investorId,
        meetingType: validation.data.meetingType,
        scheduledAt: validation.data.scheduledAt,
      },
    })

    return {
      success: true,
      data: { id: meetingRef.id, ...meetingData } as InvestorMeeting,
    }
  } catch (error) {
    console.error('Create meeting error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create meeting' },
    }
  }
}

/**
 * Update a meeting.
 *
 * @param meetingId - ID of the meeting
 * @param input - Fields to update
 * @returns The updated meeting or an error
 */
export async function updateMeeting(
  meetingId: string,
  input: UpdateMeetingInput
): Promise<ApiResponse<InvestorMeeting>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Viewers cannot edit meetings',
        },
      }
    }

    const validation = updateMeetingSchema.safeParse(input)
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
    const meetingRef = db.collection(COLLECTIONS.INVESTOR_MEETINGS).doc(meetingId)
    const meetingDoc = await meetingRef.get()

    if (!meetingDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Meeting not found' },
      }
    }

    const existingMeeting = meetingDoc.data() as InvestorMeeting

    if (existingMeeting.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const updateData = {
      ...validation.data,
      updatedAt: new Date().toISOString(),
    }

    await meetingRef.update(updateData)

    // If outcome was set, log activity
    if (validation.data.outcome) {
      await logActivity({
        type: 'meeting_completed',
        targetType: 'meeting',
        targetId: meetingId,
        targetName: existingMeeting.title,
        metadata: {
          outcome: validation.data.outcome,
          investorId: existingMeeting.investorId,
        },
      })
    }

    return {
      success: true,
      data: { ...existingMeeting, ...updateData, id: meetingId } as InvestorMeeting,
    }
  } catch (error) {
    console.error('Update meeting error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update meeting' },
    }
  }
}

/**
 * Delete a meeting.
 *
 * @param meetingId - ID of the meeting to delete
 * @returns Success or error
 */
export async function deleteMeeting(
  meetingId: string
): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    if (orgContext.role !== 'owner' && orgContext.role !== 'admin') {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Only admins can delete meetings',
        },
      }
    }

    const db = adminDb()
    const meetingRef = db.collection(COLLECTIONS.INVESTOR_MEETINGS).doc(meetingId)
    const meetingDoc = await meetingRef.get()

    if (!meetingDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Meeting not found' },
      }
    }

    if (meetingDoc.data()!.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    await meetingRef.delete()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete meeting error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete meeting' },
    }
  }
}

// ========================================
// INTERACTION OPERATIONS
// ========================================

/**
 * Get all interactions for an investor.
 *
 * @param investorId - ID of the investor
 * @returns Array of interactions (timeline)
 */
export async function getInvestorInteractions(
  investorId: string
): Promise<ApiResponse<InvestorInteraction[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    const db = adminDb()

    // Verify investor belongs to org
    const investorDoc = await db
      .collection(COLLECTIONS.INVESTORS)
      .doc(investorId)
      .get()

    if (!investorDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Investor not found' },
      }
    }

    if (investorDoc.data()!.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const snapshot = await db
      .collection(COLLECTIONS.INVESTOR_INTERACTIONS)
      .where('investorId', '==', investorId)
      .orderBy('createdAt', 'desc')
      .get()

    const interactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InvestorInteraction[]

    return { success: true, data: interactions }
  } catch (error) {
    console.error('Get investor interactions error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch interactions' },
    }
  }
}

/**
 * Log a new interaction with an investor.
 *
 * @param input - Interaction data
 * @returns The created interaction or an error
 */
export async function createInteraction(
  input: CreateInteractionInput
): Promise<ApiResponse<InvestorInteraction>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Viewers cannot log interactions',
        },
      }
    }

    const validation = createInteractionSchema.safeParse(input)
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

    // Verify investor exists and belongs to org
    const investorDoc = await db
      .collection(COLLECTIONS.INVESTORS)
      .doc(validation.data.investorId)
      .get()

    if (!investorDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Investor not found' },
      }
    }

    if (investorDoc.data()!.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const now = new Date().toISOString()
    const interactionRef = db.collection(COLLECTIONS.INVESTOR_INTERACTIONS).doc()

    const interactionData: Omit<InvestorInteraction, 'id'> = {
      orgId: orgContext.organization.id,
      investorId: validation.data.investorId,
      type: validation.data.type,
      subject: validation.data.subject,
      content: validation.data.content,
      documentId: validation.data.documentId,
      documentName: validation.data.documentName,
      createdBy: orgContext.user.uid,
      createdByName: orgContext.user.displayName || undefined,
      createdAt: now,
    }

    await interactionRef.set(interactionData)

    // Update investor's lastContactAt
    await db
      .collection(COLLECTIONS.INVESTORS)
      .doc(validation.data.investorId)
      .update({
        lastContactAt: now,
        updatedAt: now,
      })

    return {
      success: true,
      data: { id: interactionRef.id, ...interactionData } as InvestorInteraction,
    }
  } catch (error) {
    console.error('Create interaction error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to log interaction' },
    }
  }
}

// ========================================
// UPCOMING MEETINGS
// ========================================

/**
 * Get upcoming meetings across all investors.
 *
 * @param limit - How many meetings to return
 * @returns Array of upcoming meetings
 */
export async function getUpcomingMeetings(
  limit: number = 10
): Promise<ApiResponse<(InvestorMeeting & { investorName: string })[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    const db = adminDb()
    const now = new Date().toISOString()

    const snapshot = await db
      .collection(COLLECTIONS.INVESTOR_MEETINGS)
      .where('orgId', '==', orgContext.organization.id)
      .where('scheduledAt', '>=', now)
      .orderBy('scheduledAt', 'asc')
      .limit(limit)
      .get()

    // Get investor names for each meeting
    const meetings = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data() as InvestorMeeting
        const investorDoc = await db
          .collection(COLLECTIONS.INVESTORS)
          .doc(data.investorId)
          .get()
        const investorName = investorDoc.exists
          ? investorDoc.data()!.name
          : 'Unknown'

        return {
          ...data,
          id: doc.id,
          investorName,
        }
      })
    )

    return { success: true, data: meetings }
  } catch (error) {
    console.error('Get upcoming meetings error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch meetings' },
    }
  }
}
