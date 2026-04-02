'use server'

/**
 * Fundraising Server Actions
 *
 * This file contains all the server-side functions for managing fundraising data.
 * These handle fundraising rounds, term sheets, and cap table entries.
 *
 * WHAT ARE SERVER ACTIONS?
 * - Functions that run on the server but can be called from client components
 * - Marked with 'use server' directive at the top
 * - Used for database operations, authentication, etc.
 * - Automatically handle loading states and errors
 */

import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { getOrgContext } from '@/lib/auth/org-context'
import {
  createRoundSchema,
  updateRoundSchema,
  createTermSheetSchema,
  updateTermSheetSchema,
  createCapTableEntrySchema,
  updateCapTableEntrySchema,
} from '@/types/fundraising'
import type { ApiResponse } from '@/types/api'
import type {
  FundraisingRound,
  TermSheet,
  CapTableEntry,
  CreateRoundInput,
  UpdateRoundInput,
  CreateTermSheetInput,
  UpdateTermSheetInput,
  CreateCapTableEntryInput,
  UpdateCapTableEntryInput,
} from '@/types/fundraising'
import { logActivity } from './activity'

// ========================================
// FUNDRAISING ROUNDS
// ========================================

/**
 * Get all fundraising rounds for the current organization.
 *
 * @returns Array of fundraising rounds, ordered by creation date (newest first)
 */
export async function getRounds(): Promise<ApiResponse<FundraisingRound[]>> {
  try {
    // Check authentication and get org context
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    // Query Firestore for rounds belonging to this org
    const db = adminDb()
    const snapshot = await db
      .collection(COLLECTIONS.FUNDRAISING_ROUNDS)
      .where('orgId', '==', orgContext.organization.id)
      .orderBy('createdAt', 'desc')
      .get()

    // Transform Firestore documents to our Round type
    const rounds = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        // Ensure dates are ISO strings
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      }
    }) as FundraisingRound[]

    return { success: true, data: rounds }
  } catch (error) {
    console.error('Get rounds error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch rounds' },
    }
  }
}

/**
 * Get a single fundraising round by ID.
 */
export async function getRound(roundId: string): Promise<ApiResponse<FundraisingRound>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    const doc = await db.collection(COLLECTIONS.FUNDRAISING_ROUNDS).doc(roundId).get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Round not found' },
      }
    }

    const data = doc.data()!

    // Verify this round belongs to the user's org
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const round: FundraisingRound = {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as FundraisingRound

    return { success: true, data: round }
  } catch (error) {
    console.error('Get round error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch round' },
    }
  }
}

/**
 * Create a new fundraising round.
 */
export async function createRound(
  input: CreateRoundInput
): Promise<ApiResponse<FundraisingRound>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    // Only admins and owners can create rounds
    if (orgContext.role === 'viewer' || orgContext.role === 'member') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can create rounds' },
      }
    }

    // Validate input
    const validation = createRoundSchema.safeParse(input)
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

    // Create the round document
    const roundRef = db.collection(COLLECTIONS.FUNDRAISING_ROUNDS).doc()
    const roundData: Omit<FundraisingRound, 'id'> = {
      orgId: orgContext.organization.id,
      ...validation.data,
      raisedAmount: validation.data.raisedAmount || 0,
      createdBy: orgContext.user.uid,
      createdAt: now,
      updatedAt: now,
    }

    await roundRef.set(roundData)

    // Log activity
    await logActivity({
      type: 'round_created',
      targetType: 'round',
      targetId: roundRef.id,
      targetName: validation.data.name,
      metadata: { roundType: validation.data.type },
    })

    return {
      success: true,
      data: { id: roundRef.id, ...roundData },
    }
  } catch (error) {
    console.error('Create round error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create round' },
    }
  }
}

/**
 * Update a fundraising round.
 */
export async function updateRound(
  roundId: string,
  input: UpdateRoundInput
): Promise<ApiResponse<FundraisingRound>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot update rounds' },
      }
    }

    const validation = updateRoundSchema.safeParse(input)
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
    const roundRef = db.collection(COLLECTIONS.FUNDRAISING_ROUNDS).doc(roundId)
    const doc = await roundRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Round not found' },
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

    await roundRef.update(updateData)

    // Log activity
    await logActivity({
      type: 'round_updated',
      targetType: 'round',
      targetId: roundId,
      targetName: validation.data.name || existingData.name,
    })

    const updatedRound: FundraisingRound = {
      ...existingData,
      ...updateData,
      id: roundId,
      createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt,
    } as FundraisingRound

    return { success: true, data: updatedRound }
  } catch (error) {
    console.error('Update round error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update round' },
    }
  }
}

/**
 * Delete a fundraising round.
 */
export async function deleteRound(roundId: string): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    // Only owners and admins can delete rounds
    if (orgContext.role !== 'owner' && orgContext.role !== 'admin') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can delete rounds' },
      }
    }

    const db = adminDb()
    const roundRef = db.collection(COLLECTIONS.FUNDRAISING_ROUNDS).doc(roundId)
    const doc = await roundRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Round not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    await roundRef.delete()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete round error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete round' },
    }
  }
}

// ========================================
// TERM SHEETS
// ========================================

/**
 * Get all term sheets for a fundraising round.
 */
export async function getTermSheets(
  roundId: string
): Promise<ApiResponse<TermSheet[]>> {
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
      .collection(COLLECTIONS.TERM_SHEETS)
      .where('orgId', '==', orgContext.organization.id)
      .where('roundId', '==', roundId)
      .orderBy('receivedAt', 'desc')
      .get()

    const termSheets = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      }
    }) as TermSheet[]

    return { success: true, data: termSheets }
  } catch (error) {
    console.error('Get term sheets error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch term sheets' },
    }
  }
}

/**
 * Get all term sheets for the organization (across all rounds).
 */
export async function getAllTermSheets(): Promise<ApiResponse<TermSheet[]>> {
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
      .collection(COLLECTIONS.TERM_SHEETS)
      .where('orgId', '==', orgContext.organization.id)
      .orderBy('receivedAt', 'desc')
      .get()

    const termSheets = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      }
    }) as TermSheet[]

    return { success: true, data: termSheets }
  } catch (error) {
    console.error('Get all term sheets error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch term sheets' },
    }
  }
}

/**
 * Create a new term sheet.
 */
export async function createTermSheet(
  input: CreateTermSheetInput
): Promise<ApiResponse<TermSheet>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot create term sheets' },
      }
    }

    const validation = createTermSheetSchema.safeParse(input)
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

    const termSheetRef = db.collection(COLLECTIONS.TERM_SHEETS).doc()
    const termSheetData: Omit<TermSheet, 'id'> = {
      orgId: orgContext.organization.id,
      ...validation.data,
      createdAt: now,
      updatedAt: now,
    }

    await termSheetRef.set(termSheetData)

    // Log activity
    await logActivity({
      type: 'term_sheet_received',
      targetType: 'term_sheet',
      targetId: termSheetRef.id,
      targetName: `Term sheet from ${validation.data.investorName}`,
      metadata: {
        amount: validation.data.amount,
        valuation: validation.data.preMoneyValuation,
      },
    })

    return {
      success: true,
      data: { id: termSheetRef.id, ...termSheetData },
    }
  } catch (error) {
    console.error('Create term sheet error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create term sheet' },
    }
  }
}

/**
 * Update a term sheet.
 */
export async function updateTermSheet(
  termSheetId: string,
  input: UpdateTermSheetInput
): Promise<ApiResponse<TermSheet>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot update term sheets' },
      }
    }

    const validation = updateTermSheetSchema.safeParse(input)
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
    const termSheetRef = db.collection(COLLECTIONS.TERM_SHEETS).doc(termSheetId)
    const doc = await termSheetRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Term sheet not found' },
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

    await termSheetRef.update(updateData)

    const updatedTermSheet: TermSheet = {
      ...existingData,
      ...updateData,
      id: termSheetId,
      createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt,
    } as TermSheet

    return { success: true, data: updatedTermSheet }
  } catch (error) {
    console.error('Update term sheet error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update term sheet' },
    }
  }
}

/**
 * Delete a term sheet.
 */
export async function deleteTermSheet(termSheetId: string): Promise<ApiResponse<void>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can delete term sheets' },
      }
    }

    const db = adminDb()
    const termSheetRef = db.collection(COLLECTIONS.TERM_SHEETS).doc(termSheetId)
    const doc = await termSheetRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Term sheet not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    await termSheetRef.delete()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete term sheet error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete term sheet' },
    }
  }
}

// ========================================
// CAP TABLE
// ========================================

/**
 * Get all cap table entries for the organization.
 */
export async function getCapTable(): Promise<ApiResponse<CapTableEntry[]>> {
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
      .collection(COLLECTIONS.CAP_TABLE)
      .where('orgId', '==', orgContext.organization.id)
      .orderBy('shareholderType', 'asc')
      .orderBy('shares', 'desc')
      .get()

    const entries = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      }
    }) as CapTableEntry[]

    return { success: true, data: entries }
  } catch (error) {
    console.error('Get cap table error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch cap table' },
    }
  }
}

/**
 * Create a new cap table entry.
 */
export async function createCapTableEntry(
  input: CreateCapTableEntryInput
): Promise<ApiResponse<CapTableEntry>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    // Only admins and owners can modify cap table
    if (orgContext.role !== 'owner' && orgContext.role !== 'admin') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can modify cap table' },
      }
    }

    const validation = createCapTableEntrySchema.safeParse(input)
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

    const entryRef = db.collection(COLLECTIONS.CAP_TABLE).doc()
    const entryData: Omit<CapTableEntry, 'id'> = {
      orgId: orgContext.organization.id,
      ...validation.data,
      createdAt: now,
      updatedAt: now,
    }

    await entryRef.set(entryData)

    return {
      success: true,
      data: { id: entryRef.id, ...entryData },
    }
  } catch (error) {
    console.error('Create cap table entry error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create entry' },
    }
  }
}

/**
 * Update a cap table entry.
 */
export async function updateCapTableEntry(
  entryId: string,
  input: UpdateCapTableEntryInput
): Promise<ApiResponse<CapTableEntry>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can modify cap table' },
      }
    }

    const validation = updateCapTableEntrySchema.safeParse(input)
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
    const entryRef = db.collection(COLLECTIONS.CAP_TABLE).doc(entryId)
    const doc = await entryRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Entry not found' },
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

    await entryRef.update(updateData)

    const updatedEntry: CapTableEntry = {
      ...existingData,
      ...updateData,
      id: entryId,
      createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt,
    } as CapTableEntry

    return { success: true, data: updatedEntry }
  } catch (error) {
    console.error('Update cap table entry error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update entry' },
    }
  }
}

/**
 * Delete a cap table entry.
 */
export async function deleteCapTableEntry(entryId: string): Promise<ApiResponse<void>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can modify cap table' },
      }
    }

    const db = adminDb()
    const entryRef = db.collection(COLLECTIONS.CAP_TABLE).doc(entryId)
    const doc = await entryRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Entry not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    await entryRef.delete()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete cap table entry error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete entry' },
    }
  }
}
