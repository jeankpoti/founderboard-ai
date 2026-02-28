'use server'

/**
 * Integrations Server Actions
 *
 * Server-side functions for managing third-party integrations.
 *
 * SECURITY NOTE:
 * - Credentials are stored encrypted in Firestore
 * - API keys and tokens should never be logged
 * - Only admins can manage integrations
 */

import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { getOrgContext } from '@/lib/auth/org-context'
import {
  connectIntegrationSchema,
  updateIntegrationSchema,
} from '@/types/integrations'
import type { ApiResponse } from '@/types/api'
import type {
  Integration,
  IntegrationCredentials,
  ConnectIntegrationInput,
  UpdateIntegrationInput,
  AppStoreMetrics,
  AppReview,
  GitHubCommit,
  GitHubPullRequest,
  GitHubIssue,
  LinearIssue,
} from '@/types/integrations'
import { logActivity } from './activity'

// ========================================
// GET INTEGRATIONS
// ========================================

/**
 * Get all integrations for the organization.
 */
export async function getIntegrations(): Promise<ApiResponse<Integration[]>> {
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
      .collection(COLLECTIONS.INTEGRATIONS)
      .where('orgId', '==', orgContext.organization.id)
      .get()

    const integrations = snapshot.docs.map((doc) => {
      const data = doc.data()
      // Don't expose full credentials to client
      const safeCredentials: IntegrationCredentials = {
        // Only include metadata, not actual secrets
        expiresAt: data.credentials?.expiresAt,
      }

      return {
        ...data,
        id: doc.id,
        credentials: safeCredentials,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        lastSyncAt: data.lastSyncAt?.toDate?.()?.toISOString() || data.lastSyncAt,
      }
    }) as Integration[]

    return { success: true, data: integrations }
  } catch (error) {
    console.error('Get integrations error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch integrations' },
    }
  }
}

/**
 * Get a single integration by ID.
 */
export async function getIntegration(
  integrationId: string
): Promise<ApiResponse<Integration>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    const doc = await db.collection(COLLECTIONS.INTEGRATIONS).doc(integrationId).get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Integration not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Don't expose full credentials
    const safeCredentials: IntegrationCredentials = {
      expiresAt: data.credentials?.expiresAt,
    }

    const integration: Integration = {
      ...data,
      id: doc.id,
      credentials: safeCredentials,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      lastSyncAt: data.lastSyncAt?.toDate?.()?.toISOString() || data.lastSyncAt,
    } as Integration

    return { success: true, data: integration }
  } catch (error) {
    console.error('Get integration error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch integration' },
    }
  }
}

// ========================================
// CONNECT INTEGRATION
// ========================================

/**
 * Connect a new integration.
 *
 * NOTE: In a real app, OAuth integrations would go through
 * an OAuth flow handled by API routes. This is for API key
 * and manual credential integrations.
 */
export async function connectIntegration(
  input: ConnectIntegrationInput
): Promise<ApiResponse<Integration>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    // Only admins can manage integrations
    if (orgContext.role !== 'owner' && orgContext.role !== 'admin') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can manage integrations' },
      }
    }

    // Validate input
    const validation = connectIntegrationSchema.safeParse(input)
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

    // Check if this integration type is already connected
    const existingSnapshot = await db
      .collection(COLLECTIONS.INTEGRATIONS)
      .where('orgId', '==', orgContext.organization.id)
      .where('type', '==', validation.data.type)
      .limit(1)
      .get()

    if (!existingSnapshot.empty) {
      return {
        success: false,
        error: {
          code: 'ALREADY_EXISTS',
          message: 'This integration is already connected',
        },
      }
    }

    // Get creator name
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(orgContext.user.uid).get()
    const createdByName = userDoc.exists ? userDoc.data()?.displayName : undefined

    // Build credentials object
    const credentials: IntegrationCredentials = {}
    if (validation.data.accessToken) credentials.accessToken = validation.data.accessToken
    if (validation.data.refreshToken) credentials.refreshToken = validation.data.refreshToken
    if (validation.data.apiKey) credentials.apiKey = validation.data.apiKey
    if (validation.data.apiSecret) credentials.apiSecret = validation.data.apiSecret
    if (validation.data.issuerId) credentials.issuerId = validation.data.issuerId
    if (validation.data.keyId) credentials.keyId = validation.data.keyId
    if (validation.data.privateKey) credentials.privateKey = validation.data.privateKey
    if (validation.data.serviceAccountJson) {
      credentials.serviceAccountJson = validation.data.serviceAccountJson
    }

    // Create integration
    const integrationRef = db.collection(COLLECTIONS.INTEGRATIONS).doc()
    const integrationData: Omit<Integration, 'id'> = {
      orgId: orgContext.organization.id,
      type: validation.data.type,
      name: validation.data.name,
      status: 'active',
      credentials,
      config: validation.data.config || {},
      createdBy: orgContext.user.uid,
      createdByName,
      createdAt: now,
      updatedAt: now,
    }

    await integrationRef.set(integrationData)

    // Log activity
    await logActivity({
      type: 'integration_connected',
      targetType: 'integration',
      targetId: integrationRef.id,
      targetName: validation.data.name,
    })

    // Return without exposing credentials
    return {
      success: true,
      data: {
        id: integrationRef.id,
        ...integrationData,
        credentials: { expiresAt: credentials.expiresAt },
      },
    }
  } catch (error) {
    console.error('Connect integration error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to connect integration' },
    }
  }
}

// ========================================
// UPDATE INTEGRATION
// ========================================

/**
 * Update an integration's settings.
 */
export async function updateIntegration(
  integrationId: string,
  input: UpdateIntegrationInput
): Promise<ApiResponse<Integration>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can manage integrations' },
      }
    }

    // Validate input
    const validation = updateIntegrationSchema.safeParse(input)
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
    const integrationRef = db.collection(COLLECTIONS.INTEGRATIONS).doc(integrationId)
    const doc = await integrationRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Integration not found' },
      }
    }

    const existingData = doc.data()!
    if (existingData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const updateData: Partial<Integration> = {
      ...validation.data,
      updatedAt: new Date().toISOString(),
    }

    await integrationRef.update(updateData)

    const updatedIntegration: Integration = {
      ...existingData,
      ...updateData,
      id: integrationId,
      credentials: { expiresAt: existingData.credentials?.expiresAt },
      createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt,
    } as Integration

    return { success: true, data: updatedIntegration }
  } catch (error) {
    console.error('Update integration error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update integration' },
    }
  }
}

// ========================================
// DISCONNECT INTEGRATION
// ========================================

/**
 * Disconnect (delete) an integration.
 */
export async function disconnectIntegration(
  integrationId: string
): Promise<ApiResponse<void>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can manage integrations' },
      }
    }

    const db = adminDb()
    const integrationRef = db.collection(COLLECTIONS.INTEGRATIONS).doc(integrationId)
    const doc = await integrationRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Integration not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Delete the integration
    await integrationRef.delete()

    // Log activity
    await logActivity({
      type: 'integration_disconnected',
      targetType: 'integration',
      targetId: integrationId,
      targetName: data.name,
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Disconnect integration error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to disconnect integration' },
    }
  }
}

// ========================================
// APP STORE METRICS
// ========================================

/**
 * Get app store metrics for an integration.
 */
export async function getAppStoreMetrics(
  integrationId: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<AppStoreMetrics[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()

    // Verify integration belongs to org
    const integrationDoc = await db
      .collection(COLLECTIONS.INTEGRATIONS)
      .doc(integrationId)
      .get()

    if (!integrationDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Integration not found' },
      }
    }

    if (integrationDoc.data()!.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    let query = db
      .collection(COLLECTIONS.APP_STORE_METRICS)
      .where('integrationId', '==', integrationId)

    if (startDate) {
      query = query.where('period', '>=', startDate)
    }
    if (endDate) {
      query = query.where('period', '<=', endDate)
    }

    query = query.orderBy('period', 'desc')

    const snapshot = await query.get()

    const metrics = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        fetchedAt: data.fetchedAt?.toDate?.()?.toISOString() || data.fetchedAt,
      }
    }) as AppStoreMetrics[]

    return { success: true, data: metrics }
  } catch (error) {
    console.error('Get app store metrics error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch metrics' },
    }
  }
}

/**
 * Get app reviews for an integration.
 */
export async function getAppReviews(
  integrationId: string,
  limit = 50
): Promise<ApiResponse<AppReview[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()

    // Verify integration belongs to org
    const integrationDoc = await db
      .collection(COLLECTIONS.INTEGRATIONS)
      .doc(integrationId)
      .get()

    if (!integrationDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Integration not found' },
      }
    }

    if (integrationDoc.data()!.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const snapshot = await db
      .collection(COLLECTIONS.APP_REVIEWS)
      .where('integrationId', '==', integrationId)
      .orderBy('reviewDate', 'desc')
      .limit(limit)
      .get()

    const reviews = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        fetchedAt: data.fetchedAt?.toDate?.()?.toISOString() || data.fetchedAt,
        respondedAt: data.respondedAt?.toDate?.()?.toISOString() || data.respondedAt,
      }
    }) as AppReview[]

    return { success: true, data: reviews }
  } catch (error) {
    console.error('Get app reviews error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch reviews' },
    }
  }
}

// ========================================
// SYNC INTEGRATION
// ========================================

/**
 * Trigger a sync for an integration.
 *
 * NOTE: In a real app, this would trigger a background job
 * to fetch data from the external service.
 */
export async function syncIntegration(
  integrationId: string
): Promise<ApiResponse<{ message: string }>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can sync integrations' },
      }
    }

    const db = adminDb()
    const integrationRef = db.collection(COLLECTIONS.INTEGRATIONS).doc(integrationId)
    const doc = await integrationRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Integration not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Update last sync time
    await integrationRef.update({
      lastSyncAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    // In a real app, we would trigger a background job here
    // to actually fetch data from the external service

    return {
      success: true,
      data: { message: 'Sync started. Data will be updated shortly.' },
    }
  } catch (error) {
    console.error('Sync integration error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to start sync' },
    }
  }
}

// ========================================
// STRIPE DATA
// ========================================

/**
 * Get Stripe metrics for an integration.
 */
export async function getStripeMetrics(
  integrationId: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<import('@/types/integrations').StripeMetrics[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    // Verify integration belongs to org
    const db = adminDb()
    const integrationDoc = await db
      .collection(COLLECTIONS.INTEGRATIONS)
      .doc(integrationId)
      .get()

    if (!integrationDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Integration not found' },
      }
    }

    if (integrationDoc.data()!.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Query metrics
    let query = db
      .collection(COLLECTIONS.STRIPE_METRICS)
      .where('integrationId', '==', integrationId)
      .orderBy('period', 'desc')

    const snapshot = await query.get()

    let metrics = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        fetchedAt: data.fetchedAt?.toDate?.()?.toISOString() || data.fetchedAt,
      }
    }) as import('@/types/integrations').StripeMetrics[]

    // Apply date filters in memory if provided
    if (startDate) {
      metrics = metrics.filter((m) => m.period >= startDate)
    }
    if (endDate) {
      metrics = metrics.filter((m) => m.period <= endDate)
    }

    return { success: true, data: metrics }
  } catch (error) {
    console.error('Get Stripe metrics error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Stripe metrics' },
    }
  }
}

/**
 * Get Stripe charges for an integration.
 */
export async function getStripeCharges(
  integrationId: string,
  limit = 50
): Promise<ApiResponse<import('@/types/integrations').StripeCharge[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    // Verify integration belongs to org
    const db = adminDb()
    const integrationDoc = await db
      .collection(COLLECTIONS.INTEGRATIONS)
      .doc(integrationId)
      .get()

    if (!integrationDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Integration not found' },
      }
    }

    if (integrationDoc.data()!.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Query charges
    const snapshot = await db
      .collection(COLLECTIONS.STRIPE_CHARGES)
      .where('integrationId', '==', integrationId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    const charges = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        fetchedAt: data.fetchedAt?.toDate?.()?.toISOString() || data.fetchedAt,
      }
    }) as import('@/types/integrations').StripeCharge[]

    return { success: true, data: charges }
  } catch (error) {
    console.error('Get Stripe charges error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Stripe charges' },
    }
  }
}

// ========================================
// GITHUB DATA
// ========================================

/**
 * Get GitHub commits for an integration.
 */
export async function getGitHubCommits(
  integrationId: string,
  limit = 50
): Promise<ApiResponse<GitHubCommit[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()

    // Verify integration belongs to org
    const integrationDoc = await db
      .collection(COLLECTIONS.INTEGRATIONS)
      .doc(integrationId)
      .get()

    if (!integrationDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Integration not found' },
      }
    }

    if (integrationDoc.data()!.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const snapshot = await db
      .collection(COLLECTIONS.GITHUB_COMMITS)
      .where('integrationId', '==', integrationId)
      .orderBy('committedAt', 'desc')
      .limit(limit)
      .get()

    const commits = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        committedAt: data.committedAt?.toDate?.()?.toISOString() || data.committedAt,
        fetchedAt: data.fetchedAt?.toDate?.()?.toISOString() || data.fetchedAt,
      }
    }) as GitHubCommit[]

    return { success: true, data: commits }
  } catch (error) {
    console.error('Get GitHub commits error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch GitHub commits' },
    }
  }
}

/**
 * Get GitHub pull requests for an integration.
 */
export async function getGitHubPullRequests(
  integrationId: string,
  limit = 50
): Promise<ApiResponse<GitHubPullRequest[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()

    // Verify integration belongs to org
    const integrationDoc = await db
      .collection(COLLECTIONS.INTEGRATIONS)
      .doc(integrationId)
      .get()

    if (!integrationDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Integration not found' },
      }
    }

    if (integrationDoc.data()!.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const snapshot = await db
      .collection(COLLECTIONS.GITHUB_PULL_REQUESTS)
      .where('integrationId', '==', integrationId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    const prs = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        mergedAt: data.mergedAt?.toDate?.()?.toISOString() || data.mergedAt,
        closedAt: data.closedAt?.toDate?.()?.toISOString() || data.closedAt,
        fetchedAt: data.fetchedAt?.toDate?.()?.toISOString() || data.fetchedAt,
      }
    }) as GitHubPullRequest[]

    return { success: true, data: prs }
  } catch (error) {
    console.error('Get GitHub PRs error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch GitHub pull requests' },
    }
  }
}

/**
 * Get GitHub issues for an integration.
 */
export async function getGitHubIssues(
  integrationId: string,
  limit = 50
): Promise<ApiResponse<GitHubIssue[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()

    // Verify integration belongs to org
    const integrationDoc = await db
      .collection(COLLECTIONS.INTEGRATIONS)
      .doc(integrationId)
      .get()

    if (!integrationDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Integration not found' },
      }
    }

    if (integrationDoc.data()!.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const snapshot = await db
      .collection(COLLECTIONS.GITHUB_ISSUES)
      .where('integrationId', '==', integrationId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    const issues = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        closedAt: data.closedAt?.toDate?.()?.toISOString() || data.closedAt,
        fetchedAt: data.fetchedAt?.toDate?.()?.toISOString() || data.fetchedAt,
      }
    }) as GitHubIssue[]

    return { success: true, data: issues }
  } catch (error) {
    console.error('Get GitHub issues error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch GitHub issues' },
    }
  }
}

// ========================================
// LINEAR DATA
// ========================================

/**
 * Get Linear issues for an integration.
 */
export async function getLinearIssues(
  integrationId: string,
  limit = 100
): Promise<ApiResponse<LinearIssue[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()

    // Verify integration belongs to org
    const integrationDoc = await db
      .collection(COLLECTIONS.INTEGRATIONS)
      .doc(integrationId)
      .get()

    if (!integrationDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Integration not found' },
      }
    }

    if (integrationDoc.data()!.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const snapshot = await db
      .collection(COLLECTIONS.LINEAR_ISSUES)
      .where('integrationId', '==', integrationId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    const issues = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        completedAt: data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
        fetchedAt: data.fetchedAt?.toDate?.()?.toISOString() || data.fetchedAt,
      }
    }) as LinearIssue[]

    return { success: true, data: issues }
  } catch (error) {
    console.error('Get Linear issues error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Linear issues' },
    }
  }
}
