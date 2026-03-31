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
  IntegrationType,
  IntegrationCredentials,
  ConnectIntegrationInput,
  UpdateIntegrationInput,
  AppStoreMetrics,
  AppReview,
  GitHubCommit,
  GitHubPullRequest,
  GitHubIssue,
  LinearIssue,
  GoogleAnalyticsMetrics,
  GoogleAnalyticsPageView,
  GoogleAnalyticsTrafficSource,
  PostHogEvent,
  PostHogFunnel,
  PostHogRetention,
  IntercomConversation,
  IntercomMetrics,
  SlackNotificationConfig,
  SlackNotificationLog,
} from '@/types/integrations'
import { logActivity } from './activity'
import {
  AppStoreConnectClient,
  calculateAverageRating,
  type AppStoreApp,
} from '@/lib/integrations/appStoreConnectClient'

type LiveValidationResult = {
  status: Integration['status']
  lastError?: string
}

function normalizeIntegrationType(type: string | undefined): IntegrationType {
  if (type === 'mixpanel') {
    return 'posthog'
  }

  return type as IntegrationType
}

function getSafeCredentials(
  credentials: IntegrationCredentials | undefined
): IntegrationCredentials {
  return {
    expiresAt: credentials?.expiresAt,
  }
}

function formatIntegrationRecord(
  integrationId: string,
  data: FirebaseFirestore.DocumentData,
  validation?: LiveValidationResult
): Integration {
  const normalizedType = normalizeIntegrationType(data.type)

  return {
    ...data,
    id: integrationId,
    type: normalizedType,
    status: validation?.status || data.status,
    lastError: validation?.lastError || undefined,
    lastSyncAt: undefined,
    credentials: getSafeCredentials(data.credentials),
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
  } as Integration
}

async function validateIntegrationConnection(
  type: IntegrationType,
  credentials: IntegrationCredentials,
  config: Integration['config'] = {}
): Promise<LiveValidationResult> {
  try {
    switch (type) {
      case 'app_store_connect': {
        if (!credentials.issuerId || !credentials.keyId || !credentials.privateKey) {
          return { status: 'error', lastError: 'Missing App Store Connect credentials' }
        }

        const client = new AppStoreConnectClient({
          issuerId: credentials.issuerId,
          keyId: credentials.keyId,
          privateKey: credentials.privateKey,
        })
        await client.getApps()
        return { status: 'active' }
      }

      case 'stripe': {
        if (!credentials.apiKey) {
          return { status: 'error', lastError: 'Missing Stripe API key' }
        }

        const response = await fetch('https://api.stripe.com/v1/account', {
          headers: {
            Authorization: `Bearer ${credentials.apiKey}`,
          },
        })

        if (!response.ok) {
          return { status: 'error', lastError: 'Stripe authentication failed' }
        }

        return { status: 'active' }
      }

      case 'github': {
        if (!credentials.accessToken) {
          return { status: 'error', lastError: 'Missing GitHub access token' }
        }

        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            Accept: 'application/vnd.github+json',
          },
        })
        if (!userResponse.ok) {
          return { status: 'error', lastError: 'GitHub authentication failed' }
        }

        if (config.githubRepo) {
          if (!config.githubRepo.includes('/')) {
            return {
              status: 'error',
              lastError: 'GitHub repository must use the format owner/repository',
            }
          }

          const repoResponse = await fetch(`https://api.github.com/repos/${config.githubRepo}`, {
            headers: {
              Authorization: `Bearer ${credentials.accessToken}`,
              Accept: 'application/vnd.github+json',
            },
          })
          if (!repoResponse.ok) {
            return { status: 'error', lastError: `GitHub repository not accessible: ${config.githubRepo}` }
          }
        }

        return { status: 'active' }
      }

      case 'linear': {
        if (!credentials.accessToken) {
          return { status: 'error', lastError: 'Missing Linear access token' }
        }

        const response = await fetch('https://api.linear.app/graphql', {
          method: 'POST',
          headers: {
            Authorization: credentials.accessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'query Viewer { viewer { id name } }',
          }),
        })

        if (!response.ok) {
          return { status: 'error', lastError: 'Linear authentication failed' }
        }

        const payload = await response.json() as { errors?: Array<{ message?: string }> }
        if (payload.errors?.length) {
          return { status: 'error', lastError: payload.errors[0]?.message || 'Linear authentication failed' }
        }

        return { status: 'active' }
      }

      case 'slack': {
        if (!credentials.accessToken) {
          return { status: 'error', lastError: 'Missing Slack access token' }
        }

        const response = await fetch('https://slack.com/api/auth.test', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
          },
        })

        const payload = await response.json() as { ok?: boolean; error?: string }
        if (!response.ok || !payload.ok) {
          return { status: 'error', lastError: payload.error || 'Slack authentication failed' }
        }

        return { status: 'active' }
      }

      case 'notion': {
        if (!credentials.accessToken) {
          return { status: 'error', lastError: 'Missing Notion access token' }
        }

        const response = await fetch('https://api.notion.com/v1/users/me', {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            'Notion-Version': '2022-06-28',
          },
        })

        if (!response.ok) {
          return { status: 'error', lastError: 'Notion authentication failed' }
        }

        return { status: 'active' }
      }

      case 'google_analytics': {
        if (!credentials.accessToken) {
          return { status: 'error', lastError: 'Missing Google Analytics access token' }
        }

        const response = await fetch('https://analyticsadmin.googleapis.com/v1beta/accounts?pageSize=1', {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
          },
        })

        if (!response.ok) {
          return { status: 'error', lastError: 'Google Analytics authentication failed' }
        }

        return { status: 'active' }
      }

      case 'intercom': {
        if (!credentials.apiKey) {
          return { status: 'error', lastError: 'Missing Intercom API key' }
        }

        const response = await fetch('https://api.intercom.io/me', {
          headers: {
            Authorization: `Bearer ${credentials.apiKey}`,
            Accept: 'application/json',
            'Intercom-Version': '2.11',
          },
        })

        if (!response.ok) {
          return { status: 'error', lastError: 'Intercom authentication failed' }
        }

        return { status: 'active' }
      }

      case 'google_play': {
        if (!credentials.serviceAccountJson) {
          return { status: 'error', lastError: 'Missing Google Play service account JSON' }
        }
        if (!config.playPackageName) {
          return { status: 'error', lastError: 'Missing Google Play package name' }
        }

        JSON.parse(credentials.serviceAccountJson)
        return {
          status: 'error',
          lastError: 'Google Play live validation is not implemented yet for service-account auth',
        }
      }

      case 'posthog': {
        if (!credentials.apiKey) {
          return { status: 'error', lastError: 'Missing PostHog personal API key' }
        }
        if (!config.posthogProjectId) {
          return { status: 'error', lastError: 'Missing PostHog project ID' }
        }

        const host = getPostHogHost(config)
        const response = await fetch(`${host}/api/projects/${config.posthogProjectId}/query/`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${credentials.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: {
              kind: 'HogQLQuery',
              query: 'SELECT 1 AS healthy LIMIT 1',
            },
          }),
        })

        if (!response.ok) {
          return {
            status: 'error',
            lastError: await getPostHogErrorMessage(response),
          }
        }

        return { status: 'active' }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Validation failed'
    return { status: 'error', lastError: message }
  }
}

type PostHogQueryResponse = {
  columns?: string[]
  results?: unknown[]
}

type PostHogApiErrorResponse = {
  type?: string
  code?: string
  detail?: string
}

function getPostHogHost(config: Integration['config'] = {}): string {
  const configuredHost = config.posthogHost?.trim()
  const host = configuredHost && configuredHost.length > 0
    ? configuredHost
    : 'https://us.posthog.com'

  return host.replace(/\/+$/, '')
}

async function getPostHogIntegrationContext(
  integrationId: string,
  orgId: string
): Promise<{
  credentials: IntegrationCredentials
  config: Integration['config']
  host: string
  projectId: string
}> {
  const db = adminDb()
  const integrationDoc = await db.collection(COLLECTIONS.INTEGRATIONS).doc(integrationId).get()

  if (!integrationDoc.exists) {
    throw new Error('Integration not found')
  }

  const data = integrationDoc.data()!
  if (data.orgId !== orgId) {
    throw new Error('Access denied')
  }

  if (normalizeIntegrationType(data.type) !== 'posthog') {
    throw new Error('Integration is not PostHog')
  }

  const credentials = (data.credentials || {}) as IntegrationCredentials
  const config = (data.config || {}) as Integration['config']
  const projectId = config.posthogProjectId?.trim()

  if (!credentials.apiKey) {
    throw new Error('Missing PostHog personal API key')
  }
  if (!projectId) {
    throw new Error('Missing PostHog project ID')
  }

  return {
    credentials,
    config,
    host: getPostHogHost(config),
    projectId,
  }
}

function normalizePostHogQueryRows(
  payload: PostHogQueryResponse
): Array<Record<string, unknown>> {
  if (!Array.isArray(payload.results)) {
    return []
  }

  return payload.results.flatMap((row) => {
    if (Array.isArray(row) && Array.isArray(payload.columns)) {
      return [Object.fromEntries(payload.columns.map((column, index) => [column, row[index]]))]
    }

    if (row && typeof row === 'object') {
      return [row as Record<string, unknown>]
    }

    return []
  })
}

async function runPostHogHogQLQuery(
  host: string,
  projectId: string,
  apiKey: string,
  query: string
): Promise<Array<Record<string, unknown>>> {
  const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: {
        kind: 'HogQLQuery',
        query,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(await getPostHogErrorMessage(response))
  }

  const payload = await response.json() as PostHogQueryResponse
  return normalizePostHogQueryRows(payload)
}

function parsePostHogNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

async function getPostHogErrorMessage(response: Response): Promise<string> {
  const fallback = `PostHog API error: ${response.status} ${response.statusText}`

  try {
    const payload = await response.json() as PostHogApiErrorResponse
    if (payload.detail?.includes("query:read")) {
      return 'PostHog personal API key requires the query:read scope'
    }

    return payload.detail || fallback
  } catch {
    return fallback
  }
}

async function githubRequest<T>(
  accessToken: string,
  endpoint: string
): Promise<T> {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  return response.json() as Promise<T>
}

async function getGitHubIntegrationContext(
  integrationId: string,
  orgId: string
): Promise<{
  credentials: IntegrationCredentials
  config: Integration['config']
}> {
  const db = adminDb()
  const integrationDoc = await db
    .collection(COLLECTIONS.INTEGRATIONS)
    .doc(integrationId)
    .get()

  if (!integrationDoc.exists) {
    throw new Error('Integration not found')
  }

  const integrationData = integrationDoc.data()!
  if (integrationData.orgId !== orgId) {
    throw new Error('Access denied')
  }

  if (integrationData.type !== 'github') {
    throw new Error('Integration is not GitHub')
  }

  const credentials = integrationData.credentials as IntegrationCredentials
  if (!credentials.accessToken) {
    throw new Error('Missing GitHub access token')
  }

  return {
    credentials,
    config: integrationData.config || {},
  }
}

async function resolveGitHubRepositories(
  accessToken: string,
  configuredRepo: string | undefined,
  userLogin: string,
  limit = 5
): Promise<string[]> {
  if (configuredRepo?.includes('/')) {
    return [configuredRepo]
  }

  interface GitHubRepoSummary {
    full_name: string
  }

  if (configuredRepo && configuredRepo === userLogin) {
    const repos = await githubRequest<GitHubRepoSummary[]>(
      accessToken,
      `/user/repos?sort=updated&per_page=${limit}&affiliation=owner,collaborator,organization_member`
    )

    return repos.map((repo) => repo.full_name)
  }

  if (configuredRepo) {
    const repos = await githubRequest<GitHubRepoSummary[]>(
      accessToken,
      `/users/${configuredRepo}/repos?sort=updated&per_page=${limit}`
    )

    return repos.map((repo) => repo.full_name)
  }

  const repos = await githubRequest<GitHubRepoSummary[]>(
    accessToken,
    `/user/repos?sort=updated&per_page=${limit}&affiliation=owner,collaborator,organization_member`
  )

  return repos.map((repo) => repo.full_name)
}

async function getGoogleAnalyticsIntegrationContext(
  integrationId: string,
  orgId: string
): Promise<{
  accessToken: string
  propertyId: string
}> {
  const db = adminDb()
  const integrationDoc = await db
    .collection(COLLECTIONS.INTEGRATIONS)
    .doc(integrationId)
    .get()

  if (!integrationDoc.exists) {
    throw new Error('Integration not found')
  }

  const integrationData = integrationDoc.data()!
  if (integrationData.orgId !== orgId) {
    throw new Error('Access denied')
  }

  if (integrationData.type !== 'google_analytics') {
    throw new Error('Integration is not Google Analytics')
  }

  const credentials = integrationData.credentials as IntegrationCredentials
  const config = (integrationData.config || {}) as Integration['config']
  if (!credentials.accessToken) {
    throw new Error('Missing Google Analytics access token')
  }

  const configuredPropertyId = config.googleAnalyticsPropertyId?.trim()
  if (configuredPropertyId) {
    return {
      accessToken: credentials.accessToken,
      propertyId: configuredPropertyId.replace(/^properties\//, ''),
    }
  }

  interface AccountSummariesResponse {
    accountSummaries?: Array<{
      propertySummaries?: Array<{
        property?: string
      }>
    }>
  }

  const response = await fetch(
    'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200',
    {
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Analytics Admin API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const payload = await response.json() as AccountSummariesResponse
  const property = payload.accountSummaries
    ?.flatMap((account) => account.propertySummaries || [])
    .find((summary) => summary.property)?.property

  if (!property) {
    throw new Error('No accessible Google Analytics properties found')
  }

  return {
    accessToken: credentials.accessToken,
    propertyId: property.replace(/^properties\//, ''),
  }
}

async function runGoogleAnalyticsReport(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>
): Promise<{
  dimensionHeaders?: Array<{ name: string }>
  metricHeaders?: Array<{ name: string }>
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>
    metricValues?: Array<{ value?: string }>
  }>
}> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Analytics Data API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  return response.json()
}

function parseGoogleAnalyticsNumber(value: string | undefined): number {
  if (!value) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeGoogleAnalyticsPercent(value: string | undefined): number {
  const parsed = parseGoogleAnalyticsNumber(value)
  return parsed <= 1 ? Math.round(parsed * 1000) / 10 : Math.round(parsed * 10) / 10
}

// ========================================
// APP STORE CONNECT - FETCH APPS
// ========================================

/**
 * Fetch available apps from App Store Connect using provided credentials.
 * Used during integration setup to let users select which app to track.
 */
export async function fetchAppStoreApps(credentials: {
  issuerId: string
  keyId: string
  privateKey: string
}): Promise<ApiResponse<AppStoreApp[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    // Validate credentials are provided
    if (!credentials.issuerId || !credentials.keyId || !credentials.privateKey) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required credentials' },
      }
    }

    // Create client and fetch apps
    const client = new AppStoreConnectClient({
      issuerId: credentials.issuerId,
      keyId: credentials.keyId,
      privateKey: credentials.privateKey,
    })

    const apps = await client.getApps()

    return { success: true, data: apps }
  } catch (error) {
    console.error('Fetch App Store apps error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch apps'
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
    }
  }
}

/**
 * Fetch available apps from App Store Connect using an existing integration's stored credentials.
 * Used when editing an integration to change the selected app.
 */
export async function fetchAppStoreAppsForIntegration(
  integrationId: string
): Promise<ApiResponse<AppStoreApp[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

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

    const data = integrationDoc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    if (data.type !== 'app_store_connect') {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Integration is not App Store Connect' },
      }
    }

    const credentials = data.credentials as IntegrationCredentials
    if (!credentials.issuerId || !credentials.keyId || !credentials.privateKey) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Integration missing credentials' },
      }
    }

    // Create client and fetch apps
    const client = new AppStoreConnectClient({
      issuerId: credentials.issuerId,
      keyId: credentials.keyId,
      privateKey: credentials.privateKey,
    })

    const apps = await client.getApps()

    return { success: true, data: apps }
  } catch (error) {
    console.error('Fetch App Store apps for integration error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch apps'
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
    }
  }
}

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

    const integrations = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data()
        const validation = await validateIntegrationConnection(
          normalizeIntegrationType(data.type),
          (data.credentials || {}) as IntegrationCredentials,
          data.config || {}
        )

        return formatIntegrationRecord(doc.id, data, validation)
      })
    )

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

    const validation = await validateIntegrationConnection(
      normalizeIntegrationType(data.type),
      (data.credentials || {}) as IntegrationCredentials,
      data.config || {}
    )

    const integration = formatIntegrationRecord(doc.id, data, validation)

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
      .get()

    const hasExistingType = existingSnapshot.docs.some((doc) => {
      const existingType = normalizeIntegrationType(doc.data().type)
      return existingType === validation.data.type
    })

    if (hasExistingType) {
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

    const validationStatus = await validateIntegrationConnection(
      validation.data.type,
      credentials,
      validation.data.config || {}
    )

    if (validationStatus.status !== 'active') {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationStatus.lastError || 'Unable to validate integration credentials',
        },
      }
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
        credentials: getSafeCredentials(credentials),
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

    const mergedConfig = {
      ...(existingData.config || {}),
      ...(validation.data.config || {}),
    }

    const validationStatus = await validateIntegrationConnection(
      normalizeIntegrationType(existingData.type),
      (existingData.credentials || {}) as IntegrationCredentials,
      mergedConfig
    )

    if (validationStatus.status !== 'active') {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationStatus.lastError || 'Updated integration settings are invalid',
        },
      }
    }

    const updateData: Partial<Integration> = {
      ...validation.data,
      config: validation.data.config ? mergedConfig : existingData.config,
      updatedAt: new Date().toISOString(),
    }

    await integrationRef.update(updateData)

    const updatedIntegration: Integration = {
      ...existingData,
      ...updateData,
      id: integrationId,
      type: normalizeIntegrationType(existingData.type),
      status: validationStatus.status,
      lastError: validationStatus.lastError,
      credentials: getSafeCredentials(existingData.credentials),
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
 * Fetches directly from App Store Connect API (not from Firestore).
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

    // Get integration with credentials
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

    const integrationData = integrationDoc.data()!
    if (integrationData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Only App Store Connect is supported for now
    if (integrationData.type !== 'app_store_connect') {
      return { success: true, data: [] }
    }

    const credentials = integrationData.credentials as IntegrationCredentials
    const config = integrationData.config as { appStoreAppId?: string; vendorNumber?: string }

    // Validate credentials
    if (!credentials.issuerId || !credentials.keyId || !credentials.privateKey) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing App Store Connect credentials' },
      }
    }

    // Create API client
    const client = new AppStoreConnectClient({
      issuerId: credentials.issuerId,
      keyId: credentials.keyId,
      privateKey: credentials.privateKey,
    })

    // Get apps and select the configured one
    const apps = await client.getApps()
    if (apps.length === 0) {
      return { success: true, data: [] }
    }

    const targetAppId = config.appStoreAppId
    const app = targetAppId
      ? apps.find((a) => a.id === targetAppId) || apps[0]
      : apps[0]

    console.log(`[getAppStoreMetrics] Selected app: ${app.name} (ID: ${app.id})`)

    // Fetch reviews to get recent written feedback
    const reviews = await client.getCustomerReviews(app.id, 50)
    const publicMetadata = await client.getPublicAppMetadata(app.bundleId)
    const avgRating = publicMetadata?.averageRating || calculateAverageRating(reviews)
    const totalRatings = publicMetadata?.ratingCount || reviews.length

    // Try to fetch analytics data (active devices, etc.)
    // Note: Analytics reports require setup and take 1-2 days to generate initially
    let analyticsData: { activeDevices: number; installs: number; sessions: number } | null = null
    try {
      analyticsData = await client.getAppUsageMetrics(app.id)
      if (analyticsData) {
        console.log(`[getAppStoreMetrics] Analytics data: ${JSON.stringify(analyticsData)}`)
      } else {
        console.log(`[getAppStoreMetrics] Analytics data not yet available (reports may still be generating)`)
      }
    } catch (analyticsError) {
      console.log(`[getAppStoreMetrics] Analytics API not available:`, analyticsError)
    }

    // Build date range for fetching
    const today = new Date()
    const dates: string[] = []

    // Determine how many days to fetch based on date range
    let daysToFetch: number
    if (!startDate) {
      // "All Time" - fetch maximum available data (365 days)
      daysToFetch = 365
    } else {
      const start = new Date(startDate)
      daysToFetch = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      daysToFetch = Math.max(daysToFetch, 7) // At least 7 days
    }

    console.log(`[getAppStoreMetrics] Fetching ${daysToFetch} days of data (startDate: ${startDate || 'All Time'})`)

    // Sales reports have ~1-2 day delay, start from day 2
    // Apple only retains daily reports for 365 days, so cap at 364 to be safe
    const maxDaysBack = Math.min(daysToFetch + 2, 364)

    for (let i = 2; i <= maxDaysBack; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      // Apply date filters
      if (startDate && dateStr < startDate) continue
      if (endDate && dateStr > endDate) continue

      dates.push(dateStr)
    }

    console.log(`[getAppStoreMetrics] Fetching ${dates.length} days of data`)

    // Collect daily metrics with breakdown by type
    const dailyMetrics: Map<string, {
      downloads: number
      newDownloads: number
      redownloads: number
      updates: number
      revenue: number
      currency: string
    }> = new Map()

    if (config.vendorNumber && dates.length > 0) {
      // Fetch in batches of 7
      for (let batch = 0; batch < dates.length; batch += 7) {
        const batchDates = dates.slice(batch, batch + 7)
        const salesPromises = batchDates.map(reportDate =>
          client.getSalesReports(config.vendorNumber!, reportDate)
            .then(reports => ({ reportDate, reports }))
            .catch(() => ({ reportDate, reports: [] })) // Handle missing reports gracefully
        )

        const batchResults = await Promise.all(salesPromises)

        for (const { reportDate, reports } of batchResults) {
          for (const report of reports) {
            // Only include data for the selected app
            if (
              report.appId === app.id ||
              report.sku === app.sku ||
              report.parentIdentifier === app.sku
            ) {
              const existing = dailyMetrics.get(reportDate) || {
                downloads: 0,
                newDownloads: 0,
                redownloads: 0,
                updates: 0,
                revenue: 0,
                currency: 'USD'
              }
              existing.downloads += report.units
              existing.newDownloads += report.downloads
              existing.redownloads += report.redownloads
              existing.updates += report.updates
              existing.revenue += report.proceeds
              if (report.proceedsCurrency) {
                existing.currency = report.proceedsCurrency
              }
              dailyMetrics.set(reportDate, existing)
            }
          }
        }
      }
    }

    const now = new Date().toISOString()

    // Get active devices from analytics (0 if not available)
    const activeDevices = analyticsData?.activeDevices || 0

    // Build metrics array
    const metrics: AppStoreMetrics[] = []
    for (const [period, data] of dailyMetrics) {
      metrics.push({
        id: `${integrationId}_${app.id}_${period}`,
        orgId: orgContext.organization.id,
        integrationId,
        appId: app.id,
        appName: app.name,
        platform: 'ios',
        period,
        downloads: data.downloads,
        newDownloads: data.newDownloads,
        redownloads: data.redownloads,
        updates: data.updates,
        revenue: Math.round(data.revenue * 100),
        currency: data.currency,
        activeDevices, // From Analytics API (same value for all periods as it's a current snapshot)
        crashFreeRate: 99.5,
        averageRating: avgRating,
        totalRatings,
        fetchedAt: now,
      })
    }

    // Sort by period descending
    metrics.sort((a, b) => b.period.localeCompare(a.period))

    console.log(`[getAppStoreMetrics] Returning ${metrics.length} metrics records`)

    return { success: true, data: metrics }
  } catch (error) {
    console.error('Get app store metrics error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch metrics'
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
    }
  }
}

/**
 * Get app reviews for an integration.
 * Fetches directly from Apple's API for real-time data.
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

    // Get integration
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

    const integration = integrationDoc.data()!
    if (integration.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Only handle App Store Connect for now
    if (integration.type !== 'app_store_connect') {
      return { success: true, data: [] }
    }

    const credentials = integration.credentials as IntegrationCredentials
    const config = integration.config as { appStoreAppId?: string; vendorNumber?: string }

    // Validate credentials
    if (!credentials?.issuerId || !credentials?.keyId || !credentials?.privateKey) {
      return {
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Missing API credentials' },
      }
    }

    // Create API client
    const client = new AppStoreConnectClient({
      issuerId: credentials.issuerId,
      keyId: credentials.keyId,
      privateKey: credentials.privateKey,
    })

    // Get apps
    const apps = await client.getApps()
    if (apps.length === 0) {
      return { success: true, data: [] }
    }

    // Select the configured app or first app
    const targetAppId = config.appStoreAppId
    const app = targetAppId
      ? apps.find((a) => a.id === targetAppId) || apps[0]
      : apps[0]

    console.log(`[getAppReviews] Fetching reviews for app: ${app.name} (ID: ${app.id})`)

    // Fetch reviews directly from API
    const apiReviews = await client.getCustomerReviews(app.id, limit)
    console.log(`[getAppReviews] Fetched ${apiReviews.length} reviews from API`)

    const now = new Date().toISOString()

    // Transform to AppReview format
    const reviews: AppReview[] = apiReviews.map((review) => ({
      id: review.id,
      orgId: orgContext.organization.id,
      integrationId,
      appId: app.id,
      platform: 'ios' as const,
      externalId: review.id,
      rating: review.rating,
      title: review.title,
      body: review.body,
      authorName: review.reviewerNickname,
      reviewDate: review.createdDate,
      fetchedAt: now,
    }))

    return { success: true, data: reviews }
  } catch (error) {
    console.error('Get app reviews error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch reviews'
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
    }
  }
}

// ========================================
// SYNC INTEGRATION
// ========================================

/**
 * Trigger a live validation for an integration.
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

    try {
      const validation = await validateIntegrationConnection(
        normalizeIntegrationType(data.type),
        (data.credentials || {}) as IntegrationCredentials,
        data.config || {}
      )

      if (validation.status !== 'active') {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.lastError || 'Integration validation failed',
          },
        }
      }

      return {
        success: true,
        data: { message: 'Integration validated successfully.' },
      }
    } catch (syncError) {
      console.error('Sync error:', syncError)
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: syncError instanceof Error ? syncError.message : 'Unknown sync error',
        },
      }
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
    const query = db
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

    const { credentials, config } = await getGitHubIntegrationContext(
      integrationId,
      orgContext.organization.id
    )

    interface GitHubUser {
      login: string
    }

    interface GitHubCommitListItem {
      sha: string
      commit: {
        message: string
        author?: {
          name?: string
          email?: string
          date?: string
        }
      }
      author?: {
        login?: string
        avatar_url?: string
      } | null
      repository?: string
    }

    interface GitHubCommitDetail {
      stats?: {
        additions?: number
        deletions?: number
        total?: number
      }
      files?: Array<unknown>
    }

    const user = await githubRequest<GitHubUser>(credentials.accessToken!, '/user')
    const repositories = await resolveGitHubRepositories(
      credentials.accessToken!,
      config.githubRepo,
      user.login
    )

    if (repositories.length === 0) {
      return { success: true, data: [] }
    }

    const perRepoLimit = Math.max(10, Math.ceil(limit / repositories.length) * 2)
    const commitLists = await Promise.all(
      repositories.map(async (repository) => {
        const commits = await githubRequest<GitHubCommitListItem[]>(
          credentials.accessToken!,
          `/repos/${repository}/commits?per_page=${perRepoLimit}`
        )

        return commits.map((commit) => ({ ...commit, repository }))
      })
    )

    const flattened = commitLists
      .flat()
      .sort((a, b) => {
        const aDate = new Date(a.commit.author?.date || 0).getTime()
        const bDate = new Date(b.commit.author?.date || 0).getTime()
        return bDate - aDate
      })
      .slice(0, limit)

    const detailEntries = await Promise.all(
      flattened.map(async (commit) => {
        const details = await githubRequest<GitHubCommitDetail>(
          credentials.accessToken!,
          `/repos/${commit.repository}/commits/${commit.sha}`
        )

        return { commit, details }
      })
    )

    const now = new Date().toISOString()
    const commits: GitHubCommit[] = detailEntries.map(({ commit, details }) => ({
      id: commit.sha,
      orgId: orgContext.organization.id,
      integrationId,
      externalId: commit.sha,
      message: commit.commit.message,
      authorName: commit.author?.login || commit.commit.author?.name || 'Unknown',
      authorEmail: commit.commit.author?.email,
      authorAvatar: commit.author?.avatar_url,
      repository: commit.repository || config.githubRepo || 'unknown',
      filesChanged: details.files?.length,
      additions: details.stats?.additions,
      deletions: details.stats?.deletions,
      committedAt: commit.commit.author?.date || now,
      fetchedAt: now,
    }))

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

    const { credentials, config } = await getGitHubIntegrationContext(
      integrationId,
      orgContext.organization.id
    )

    interface GitHubUser {
      login: string
    }

    interface GitHubPullRequestListItem {
      number: number
      title: string
      body?: string | null
      state: 'open' | 'closed'
      created_at: string
      closed_at?: string | null
      merged_at?: string | null
      comments: number
      user: {
        login: string
        avatar_url?: string
      }
      head: {
        ref: string
      }
      base: {
        ref: string
      }
      repository?: string
    }

    interface GitHubPullRequestDetail {
      additions?: number
      deletions?: number
      commits?: number
      comments?: number
      merged_at?: string | null
      closed_at?: string | null
    }

    const user = await githubRequest<GitHubUser>(credentials.accessToken!, '/user')
    const repositories = await resolveGitHubRepositories(
      credentials.accessToken!,
      config.githubRepo,
      user.login
    )

    if (repositories.length === 0) {
      return { success: true, data: [] }
    }

    const perRepoLimit = Math.max(10, Math.ceil(limit / repositories.length) * 2)
    const prLists = await Promise.all(
      repositories.map(async (repository) => {
        const prs = await githubRequest<GitHubPullRequestListItem[]>(
          credentials.accessToken!,
          `/repos/${repository}/pulls?state=all&sort=updated&direction=desc&per_page=${perRepoLimit}`
        )

        return prs.map((pr) => ({ ...pr, repository }))
      })
    )

    const flattened = prLists
      .flat()
      .sort((a, b) => {
        const aDate = new Date(a.merged_at || a.closed_at || a.created_at).getTime()
        const bDate = new Date(b.merged_at || b.closed_at || b.created_at).getTime()
        return bDate - aDate
      })
      .slice(0, limit)

    const detailEntries = await Promise.all(
      flattened.map(async (pr) => {
        const details = await githubRequest<GitHubPullRequestDetail>(
          credentials.accessToken!,
          `/repos/${pr.repository}/pulls/${pr.number}`
        )

        return { pr, details }
      })
    )

    const now = new Date().toISOString()
    const prs: GitHubPullRequest[] = detailEntries.map(({ pr, details }) => ({
      id: `${pr.repository}#${pr.number}`,
      orgId: orgContext.organization.id,
      integrationId,
      externalId: String(pr.number),
      title: pr.title,
      body: pr.body || undefined,
      state: details.merged_at ? 'merged' : pr.state,
      authorName: pr.user.login,
      authorAvatar: pr.user.avatar_url,
      repository: pr.repository || config.githubRepo || 'unknown',
      headBranch: pr.head.ref,
      baseBranch: pr.base.ref,
      commits: details.commits,
      additions: details.additions,
      deletions: details.deletions,
      comments: details.comments ?? pr.comments,
      createdAt: pr.created_at,
      mergedAt: details.merged_at || undefined,
      closedAt: details.closed_at || pr.closed_at || undefined,
      fetchedAt: now,
    }))

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

// ========================================
// GOOGLE ANALYTICS DATA
// ========================================

/**
 * Get Google Analytics metrics for an integration.
 */
export async function getGoogleAnalyticsMetrics(
  integrationId: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<GoogleAnalyticsMetrics[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const { accessToken, propertyId } = await getGoogleAnalyticsIntegrationContext(
      integrationId,
      orgContext.organization.id
    )
    const report = await runGoogleAnalyticsReport(accessToken, propertyId, {
      dateRanges: [
        {
          startDate: startDate || '30daysAgo',
          endDate: endDate || 'today',
        },
      ],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      limit: 10000,
    })

    const now = new Date().toISOString()
    const metrics: GoogleAnalyticsMetrics[] = (report.rows || []).map((row) => {
      const rawDate = row.dimensionValues?.[0]?.value || ''
      const period = rawDate.length === 8
        ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
        : rawDate

      return {
        id: `${integrationId}_${period}`,
        orgId: orgContext.organization.id,
        integrationId,
        period,
        sessions: parseGoogleAnalyticsNumber(row.metricValues?.[0]?.value),
        users: parseGoogleAnalyticsNumber(row.metricValues?.[1]?.value),
        newUsers: parseGoogleAnalyticsNumber(row.metricValues?.[2]?.value),
        pageviews: parseGoogleAnalyticsNumber(row.metricValues?.[3]?.value),
        bounceRate: normalizeGoogleAnalyticsPercent(row.metricValues?.[4]?.value),
        avgSessionDuration: Math.round(parseGoogleAnalyticsNumber(row.metricValues?.[5]?.value)),
        pagesPerSession: 0,
        fetchedAt: now,
      }
    }).map((metric) => ({
      ...metric,
      pagesPerSession: metric.sessions > 0 ? metric.pageviews / metric.sessions : 0,
    }))

    return { success: true, data: metrics }
  } catch (error) {
    console.error('Get Google Analytics metrics error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Google Analytics metrics' },
    }
  }
}

/**
 * Get Google Analytics page views for an integration.
 */
export async function getGoogleAnalyticsPages(
  integrationId: string,
  limit = 50,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<GoogleAnalyticsPageView[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const { accessToken, propertyId } = await getGoogleAnalyticsIntegrationContext(
      integrationId,
      orgContext.organization.id
    )
    const report = await runGoogleAnalyticsReport(accessToken, propertyId, {
      dateRanges: [{ startDate: startDate || '30daysAgo', endDate: endDate || 'today' }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit,
    })

    const now = new Date().toISOString()
    const pages: GoogleAnalyticsPageView[] = (report.rows || []).map((row, index) => ({
      id: `${integrationId}_page_${index}`,
      orgId: orgContext.organization.id,
      integrationId,
      period: now.split('T')[0],
      pagePath: row.dimensionValues?.[0]?.value || '/',
      pageTitle: row.dimensionValues?.[1]?.value || row.dimensionValues?.[0]?.value || '/',
      pageviews: parseGoogleAnalyticsNumber(row.metricValues?.[0]?.value),
      uniquePageviews: parseGoogleAnalyticsNumber(row.metricValues?.[1]?.value),
      avgTimeOnPage: Math.round(parseGoogleAnalyticsNumber(row.metricValues?.[2]?.value)),
      bounceRate: normalizeGoogleAnalyticsPercent(row.metricValues?.[3]?.value),
      fetchedAt: now,
    }))

    return { success: true, data: pages }
  } catch (error) {
    console.error('Get Google Analytics pages error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Google Analytics pages' },
    }
  }
}

/**
 * Get Google Analytics traffic sources for an integration.
 */
export async function getGoogleAnalyticsSources(
  integrationId: string,
  limit = 20,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<GoogleAnalyticsTrafficSource[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const { accessToken, propertyId } = await getGoogleAnalyticsIntegrationContext(
      integrationId,
      orgContext.organization.id
    )
    const report = await runGoogleAnalyticsReport(accessToken, propertyId, {
      dateRanges: [{ startDate: startDate || '30daysAgo', endDate: endDate || 'today' }],
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit,
    })

    const now = new Date().toISOString()
    const sources: GoogleAnalyticsTrafficSource[] = (report.rows || []).map((row, index) => ({
      id: `${integrationId}_source_${index}`,
      orgId: orgContext.organization.id,
      integrationId,
      period: now.split('T')[0],
      source: row.dimensionValues?.[0]?.value || '(direct)',
      medium: row.dimensionValues?.[1]?.value || '(none)',
      sessions: parseGoogleAnalyticsNumber(row.metricValues?.[0]?.value),
      users: parseGoogleAnalyticsNumber(row.metricValues?.[1]?.value),
      bounceRate: normalizeGoogleAnalyticsPercent(row.metricValues?.[2]?.value),
      conversionRate: 0,
      fetchedAt: now,
    }))

    return { success: true, data: sources }
  } catch (error) {
    console.error('Get Google Analytics sources error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Google Analytics sources' },
    }
  }
}

// ========================================
// POSTHOG DATA
// ========================================

/**
 * Get PostHog events for an integration.
 */
export async function getPostHogEvents(
  integrationId: string,
  limit = 50
): Promise<ApiResponse<PostHogEvent[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const context = await getPostHogIntegrationContext(integrationId, orgContext.organization.id)
    const safeLimit = Math.max(1, Math.min(limit, 100))
    const rows = await runPostHogHogQLQuery(
      context.host,
      context.projectId,
      context.credentials.apiKey!,
      `
        SELECT
          event AS name,
          count() AS eventCount,
          uniq(person_id) AS uniqueUsers,
          toString(toDate(max(timestamp))) AS period
        FROM events
        WHERE timestamp >= now() - INTERVAL 30 DAY
        GROUP BY event
        ORDER BY eventCount DESC
        LIMIT ${safeLimit}
      `
    )

    const fetchedAt = new Date().toISOString()
    const events = rows.map((row, index) => ({
      id: `${integrationId}-${String(row.name || `event-${index}`)}`,
      orgId: orgContext.organization.id,
      integrationId,
      name: String(row.name || 'Unknown Event'),
      eventCount: parsePostHogNumber(row.eventCount),
      uniqueUsers: parsePostHogNumber(row.uniqueUsers),
      period: String(row.period || fetchedAt.slice(0, 10)),
      fetchedAt,
    }))

    return { success: true, data: events }
  } catch (error) {
    console.error('Get PostHog events error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch PostHog events'
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
    }
  }
}

/**
 * Get PostHog funnels for an integration.
 *
 * Founderboard does not infer funnels from raw event volume because that would
 * misrepresent user progression. Funnel insights require explicit configuration.
 */
export async function getPostHogFunnels(
  integrationId: string
): Promise<ApiResponse<PostHogFunnel[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    await getPostHogIntegrationContext(integrationId, orgContext.organization.id)

    return { success: true, data: [] }
  } catch (error) {
    console.error('Get PostHog funnels error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch PostHog funnels'
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
    }
  }
}

/**
 * Get PostHog retention data for an integration.
 */
export async function getPostHogRetention(
  integrationId: string
): Promise<ApiResponse<PostHogRetention[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const context = await getPostHogIntegrationContext(integrationId, orgContext.organization.id)
    const rows = await runPostHogHogQLQuery(
      context.host,
      context.projectId,
      context.credentials.apiKey!,
      `
        WITH person_first_seen AS (
          SELECT
            person_id,
            toDate(min(timestamp)) AS cohortDate
          FROM events
          WHERE person_id IS NOT NULL
            AND timestamp >= now() - INTERVAL 120 DAY
          GROUP BY person_id
        ),
        person_activity AS (
          SELECT
            person_id,
            toDate(timestamp) AS activityDate
          FROM events
          WHERE person_id IS NOT NULL
            AND timestamp >= now() - INTERVAL 120 DAY
          GROUP BY person_id, activityDate
        )
        SELECT
          toString(person_first_seen.cohortDate) AS cohortDate,
          uniqExact(person_first_seen.person_id) AS day0Users,
          round(
            100.0 * uniqExactIf(
              person_first_seen.person_id,
              dateDiff('day', person_first_seen.cohortDate, person_activity.activityDate) = 1
            ) / nullIf(uniqExact(person_first_seen.person_id), 0),
            1
          ) AS day1,
          round(
            100.0 * uniqExactIf(
              person_first_seen.person_id,
              dateDiff('day', person_first_seen.cohortDate, person_activity.activityDate) = 7
            ) / nullIf(uniqExact(person_first_seen.person_id), 0),
            1
          ) AS day7,
          round(
            100.0 * uniqExactIf(
              person_first_seen.person_id,
              dateDiff('day', person_first_seen.cohortDate, person_activity.activityDate) = 14
            ) / nullIf(uniqExact(person_first_seen.person_id), 0),
            1
          ) AS day14,
          round(
            100.0 * uniqExactIf(
              person_first_seen.person_id,
              dateDiff('day', person_first_seen.cohortDate, person_activity.activityDate) = 30
            ) / nullIf(uniqExact(person_first_seen.person_id), 0),
            1
          ) AS day30
        FROM person_first_seen
        LEFT JOIN person_activity
          ON person_first_seen.person_id = person_activity.person_id
        WHERE person_first_seen.cohortDate >= today() - INTERVAL 84 DAY
        GROUP BY person_first_seen.cohortDate
        ORDER BY person_first_seen.cohortDate DESC
        LIMIT 12
      `
    )

    const fetchedAt = new Date().toISOString()
    const retention = rows.map((row, index) => ({
      id: `${integrationId}-retention-${String(row.cohortDate || index)}`,
      orgId: orgContext.organization.id,
      integrationId,
      cohortDate: String(row.cohortDate || fetchedAt.slice(0, 10)),
      day0Users: parsePostHogNumber(row.day0Users),
      day1: parsePostHogNumber(row.day1),
      day7: parsePostHogNumber(row.day7),
      day14: parsePostHogNumber(row.day14),
      day30: parsePostHogNumber(row.day30),
      fetchedAt,
    }))

    return { success: true, data: retention }
  } catch (error) {
    console.error('Get PostHog retention error:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch PostHog retention'
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message },
    }
  }
}

// ========================================
// INTERCOM DATA
// ========================================

/**
 * Get Intercom conversations for an integration.
 */
export async function getIntercomConversations(
  integrationId: string,
  limit = 50
): Promise<ApiResponse<IntercomConversation[]>> {
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
      .collection(COLLECTIONS.INTERCOM_CONVERSATIONS)
      .where('integrationId', '==', integrationId)
      .orderBy('updatedAt', 'desc')
      .limit(limit)
      .get()

    const conversations = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        fetchedAt: data.fetchedAt?.toDate?.()?.toISOString() || data.fetchedAt,
      }
    }) as IntercomConversation[]

    return { success: true, data: conversations }
  } catch (error) {
    console.error('Get Intercom conversations error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Intercom conversations' },
    }
  }
}

/**
 * Get Intercom metrics for an integration.
 */
export async function getIntercomMetrics(
  integrationId: string
): Promise<ApiResponse<IntercomMetrics[]>> {
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
      .collection(COLLECTIONS.INTERCOM_METRICS)
      .where('integrationId', '==', integrationId)
      .orderBy('period', 'desc')
      .get()

    const metrics = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        fetchedAt: data.fetchedAt?.toDate?.()?.toISOString() || data.fetchedAt,
      }
    }) as IntercomMetrics[]

    return { success: true, data: metrics }
  } catch (error) {
    console.error('Get Intercom metrics error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Intercom metrics' },
    }
  }
}

// ========================================
// SLACK DATA
// ========================================

/**
 * Get Slack notification config for an integration.
 */
export async function getSlackConfig(
  integrationId: string
): Promise<ApiResponse<SlackNotificationConfig | null>> {
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
      .collection(COLLECTIONS.SLACK_NOTIFICATION_CONFIG)
      .where('integrationId', '==', integrationId)
      .limit(1)
      .get()

    if (snapshot.empty) {
      return { success: true, data: null }
    }

    const doc = snapshot.docs[0]
    const data = doc.data()
    const config: SlackNotificationConfig = {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as SlackNotificationConfig

    return { success: true, data: config }
  } catch (error) {
    console.error('Get Slack config error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Slack config' },
    }
  }
}

/**
 * Update Slack notification config.
 */
export async function updateSlackConfig(
  integrationId: string,
  config: Partial<SlackNotificationConfig>
): Promise<ApiResponse<SlackNotificationConfig>> {
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
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can update notification config' },
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

    const now = new Date().toISOString()

    // Find or create config
    const snapshot = await db
      .collection(COLLECTIONS.SLACK_NOTIFICATION_CONFIG)
      .where('integrationId', '==', integrationId)
      .limit(1)
      .get()

    let configRef
    let configData: SlackNotificationConfig

    if (snapshot.empty) {
      // Create new config
      configRef = db.collection(COLLECTIONS.SLACK_NOTIFICATION_CONFIG).doc()
      configData = {
        id: configRef.id,
        orgId: orgContext.organization.id,
        integrationId,
        events: {
          milestoneCompleted: false,
          roadmapUpdated: false,
          taskCompleted: false,
          documentShared: false,
          teamMemberJoined: false,
          fundraisingUpdate: false,
        },
        ...config,
        createdAt: now,
        updatedAt: now,
      } as SlackNotificationConfig
      await configRef.set(configData)
    } else {
      // Update existing config
      configRef = snapshot.docs[0].ref
      const existingData = snapshot.docs[0].data()
      configData = {
        ...existingData,
        ...config,
        id: snapshot.docs[0].id,
        updatedAt: now,
      } as SlackNotificationConfig
      await configRef.update({ ...config, updatedAt: now })
    }

    return { success: true, data: configData }
  } catch (error) {
    console.error('Update Slack config error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update Slack config' },
    }
  }
}

/**
 * Get Slack notification logs for an integration.
 */
export async function getSlackNotificationLogs(
  integrationId: string,
  limit = 50
): Promise<ApiResponse<SlackNotificationLog[]>> {
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
      .collection(COLLECTIONS.SLACK_NOTIFICATION_LOGS)
      .where('integrationId', '==', integrationId)
      .orderBy('sentAt', 'desc')
      .limit(limit)
      .get()

    const logs = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        sentAt: data.sentAt?.toDate?.()?.toISOString() || data.sentAt,
      }
    }) as SlackNotificationLog[]

    return { success: true, data: logs }
  } catch (error) {
    console.error('Get Slack notification logs error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch Slack notification logs' },
    }
  }
}
