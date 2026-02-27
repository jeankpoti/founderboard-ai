/**
 * Integrations Types & Schemas
 *
 * This file defines all data structures for the Integrations feature.
 *
 * WHAT ARE INTEGRATIONS?
 * Integrations connect your Founderboard to external services:
 * - Slack: Team communication
 * - GitHub: Code repository
 * - Stripe: Payment processing
 * - App Store Connect: iOS app analytics
 * - Google Play Console: Android app analytics
 *
 * WHY INTEGRATE?
 * - Automatic data sync (no manual entry)
 * - Real-time metrics updates
 * - Centralized dashboard for all your tools
 */

import { z } from 'zod'

// ========================================
// INTEGRATION TYPES
// ========================================

/**
 * Supported integration types.
 *
 * Each integration has its own authentication method
 * and data that it can sync.
 */
export type IntegrationType =
  | 'slack'              // Team chat
  | 'github'             // Code repository
  | 'stripe'             // Payments
  | 'app_store_connect'  // iOS App Store
  | 'google_play'        // Google Play Store
  | 'google_analytics'   // Website analytics
  | 'mixpanel'           // Product analytics
  | 'intercom'           // Customer support
  | 'notion'             // Documentation
  | 'linear'             // Issue tracking

export const INTEGRATION_TYPES: IntegrationType[] = [
  'slack',
  'github',
  'stripe',
  'app_store_connect',
  'google_play',
  'google_analytics',
  'mixpanel',
  'intercom',
  'notion',
  'linear',
]

/**
 * Integration metadata - info about each integration type.
 */
export interface IntegrationMeta {
  name: string
  description: string
  icon: string
  category: 'communication' | 'development' | 'analytics' | 'app_stores' | 'productivity'
  authType: 'oauth' | 'api_key' | 'jwt'
  docsUrl: string
}

export const INTEGRATION_META: Record<IntegrationType, IntegrationMeta> = {
  slack: {
    name: 'Slack',
    description: 'Send notifications to your Slack channels',
    icon: '💬',
    category: 'communication',
    authType: 'oauth',
    docsUrl: 'https://api.slack.com/',
  },
  github: {
    name: 'GitHub',
    description: 'Track commits, PRs, and issues',
    icon: '🐙',
    category: 'development',
    authType: 'oauth',
    docsUrl: 'https://docs.github.com/',
  },
  stripe: {
    name: 'Stripe',
    description: 'Sync revenue and subscription data',
    icon: '💳',
    category: 'analytics',
    authType: 'api_key',
    docsUrl: 'https://stripe.com/docs',
  },
  app_store_connect: {
    name: 'App Store Connect',
    description: 'iOS app downloads, revenue, and reviews',
    icon: '🍎',
    category: 'app_stores',
    authType: 'jwt',
    docsUrl: 'https://developer.apple.com/documentation/appstoreconnectapi',
  },
  google_play: {
    name: 'Google Play Console',
    description: 'Android app downloads, revenue, and reviews',
    icon: '🤖',
    category: 'app_stores',
    authType: 'oauth',
    docsUrl: 'https://developers.google.com/android-publisher',
  },
  google_analytics: {
    name: 'Google Analytics',
    description: 'Website traffic and user behavior',
    icon: '📈',
    category: 'analytics',
    authType: 'oauth',
    docsUrl: 'https://developers.google.com/analytics',
  },
  mixpanel: {
    name: 'Mixpanel',
    description: 'Product analytics and user events',
    icon: '📊',
    category: 'analytics',
    authType: 'api_key',
    docsUrl: 'https://developer.mixpanel.com/',
  },
  intercom: {
    name: 'Intercom',
    description: 'Customer conversations and support',
    icon: '💭',
    category: 'communication',
    authType: 'api_key',
    docsUrl: 'https://developers.intercom.com/',
  },
  notion: {
    name: 'Notion',
    description: 'Sync documentation and notes',
    icon: '📝',
    category: 'productivity',
    authType: 'oauth',
    docsUrl: 'https://developers.notion.com/',
  },
  linear: {
    name: 'Linear',
    description: 'Issue tracking and project management',
    icon: '📋',
    category: 'development',
    authType: 'oauth',
    docsUrl: 'https://developers.linear.app/',
  },
}

/**
 * Integration connection status.
 */
export type IntegrationStatus = 'active' | 'error' | 'expired' | 'disconnected'

export const INTEGRATION_STATUS_LABELS: Record<IntegrationStatus, string> = {
  active: 'Connected',
  error: 'Error',
  expired: 'Expired',
  disconnected: 'Disconnected',
}

export const INTEGRATION_STATUS_COLORS: Record<IntegrationStatus, string> = {
  active: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  expired: 'bg-amber-100 text-amber-700',
  disconnected: 'bg-slate-100 text-slate-700',
}

// ========================================
// INTEGRATION INTERFACE
// ========================================

/**
 * Represents a connected integration.
 */
export interface Integration {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** Type of integration */
  type: IntegrationType

  /** Current status */
  status: IntegrationStatus

  /** Display name (e.g., "Production Stripe Account") */
  name: string

  /**
   * Encrypted credentials.
   *
   * SECURITY NOTE:
   * Credentials are encrypted before storage.
   * Never log or expose these values.
   */
  credentials: IntegrationCredentials

  /** Configuration options */
  config: IntegrationConfig

  /** Last successful sync time */
  lastSyncAt?: string

  /** Last error message (if status is 'error') */
  lastError?: string

  /** Who set up this integration */
  createdBy: string
  createdByName?: string

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

/**
 * Credentials for different integration types.
 *
 * Each integration type has different credential requirements.
 */
export type IntegrationCredentials = {
  /** OAuth access token */
  accessToken?: string
  /** OAuth refresh token */
  refreshToken?: string
  /** Token expiry time */
  expiresAt?: string
  /** API key (for api_key auth type) */
  apiKey?: string
  /** API secret */
  apiSecret?: string
  /** App Store Connect specific */
  issuerId?: string      // Apple Issuer ID
  keyId?: string         // Apple Key ID
  privateKey?: string    // Apple Private Key (.p8 content)
  /** Google specific */
  serviceAccountJson?: string  // Google Service Account JSON
}

/**
 * Configuration options for integrations.
 */
export type IntegrationConfig = {
  /** Slack: Channel to post to */
  slackChannel?: string
  /** GitHub: Repository to track */
  githubRepo?: string
  /** App Store: App ID */
  appStoreAppId?: string
  /** Google Play: Package name */
  playPackageName?: string
  /** Sync frequency in minutes */
  syncFrequency?: number
  /** Which data to sync */
  syncOptions?: string[]
}

// ========================================
// APP STORE METRICS
// ========================================

/**
 * Metrics from App Store Connect or Google Play.
 */
export interface AppStoreMetrics {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** Integration ID this came from */
  integrationId: string

  /** App identifier */
  appId: string

  /** App name */
  appName: string

  /** Platform */
  platform: 'ios' | 'android'

  /** Period (e.g., "2024-01-15") */
  period: string

  /** Downloads in this period */
  downloads: number

  /** Revenue in this period (in cents) */
  revenue: number

  /** Currency code */
  currency: string

  /** Active devices/installs */
  activeDevices: number

  /** Crash-free rate (percentage) */
  crashFreeRate: number

  /** Average rating (1-5) */
  averageRating: number

  /** Total ratings count */
  totalRatings: number

  /** When this data was fetched */
  fetchedAt: string
}

/**
 * App review from App Store or Google Play.
 */
export interface AppReview {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** Integration ID this came from */
  integrationId: string

  /** App identifier */
  appId: string

  /** Platform */
  platform: 'ios' | 'android'

  /** External review ID */
  externalId: string

  /** Rating (1-5) */
  rating: number

  /** Review title (iOS only) */
  title?: string

  /** Review body text */
  body: string

  /** Reviewer name */
  authorName: string

  /** App version reviewed */
  appVersion?: string

  /** When the review was posted */
  reviewDate: string

  /** Our response (if any) */
  response?: string

  /** When we responded */
  respondedAt?: string

  /** When this was fetched */
  fetchedAt: string
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

/**
 * Schema for connecting an integration.
 */
export const connectIntegrationSchema = z.object({
  type: z.enum(INTEGRATION_TYPES as [IntegrationType, ...IntegrationType[]]),

  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),

  // Credentials (depends on integration type)
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  issuerId: z.string().optional(),
  keyId: z.string().optional(),
  privateKey: z.string().optional(),
  serviceAccountJson: z.string().optional(),

  // Configuration
  config: z.object({
    slackChannel: z.string().optional(),
    githubRepo: z.string().optional(),
    appStoreAppId: z.string().optional(),
    playPackageName: z.string().optional(),
    syncFrequency: z.number().min(5).max(1440).optional(),
    syncOptions: z.array(z.string()).optional(),
  }).optional(),
})

/**
 * Schema for updating an integration.
 */
export const updateIntegrationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(['active', 'error', 'expired', 'disconnected'] as const).optional(),
  config: z.object({
    slackChannel: z.string().optional(),
    githubRepo: z.string().optional(),
    appStoreAppId: z.string().optional(),
    playPackageName: z.string().optional(),
    syncFrequency: z.number().min(5).max(1440).optional(),
    syncOptions: z.array(z.string()).optional(),
  }).optional(),
})

// ========================================
// TYPE INFERENCE
// ========================================

export type ConnectIntegrationInput = z.infer<typeof connectIntegrationSchema>
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get integrations by category.
 *
 * @param integrations - Array of integrations
 * @param category - Category to filter by
 * @returns Filtered integrations
 */
export function getIntegrationsByCategory(
  integrations: Integration[],
  category: IntegrationMeta['category']
): Integration[] {
  return integrations.filter(
    (i) => INTEGRATION_META[i.type].category === category
  )
}

/**
 * Get available integrations (not yet connected).
 *
 * @param connectedTypes - Array of connected integration types
 * @returns Array of available integration types
 */
export function getAvailableIntegrations(
  connectedTypes: IntegrationType[]
): IntegrationType[] {
  return INTEGRATION_TYPES.filter((type) => !connectedTypes.includes(type))
}

/**
 * Calculate total app downloads across platforms.
 *
 * @param metrics - Array of app metrics
 * @returns Total downloads
 */
export function getTotalDownloads(metrics: AppStoreMetrics[]): number {
  return metrics.reduce((sum, m) => sum + m.downloads, 0)
}

/**
 * Calculate total app revenue across platforms.
 *
 * @param metrics - Array of app metrics
 * @returns Total revenue in cents
 */
export function getTotalRevenue(metrics: AppStoreMetrics[]): number {
  return metrics.reduce((sum, m) => sum + m.revenue, 0)
}

/**
 * Get average app rating across platforms.
 *
 * @param metrics - Array of app metrics
 * @returns Average rating (1-5) or null if no data
 */
export function getAverageRating(metrics: AppStoreMetrics[]): number | null {
  if (metrics.length === 0) return null

  const totalRatings = metrics.reduce((sum, m) => sum + m.totalRatings, 0)
  if (totalRatings === 0) return null

  const weightedSum = metrics.reduce(
    (sum, m) => sum + m.averageRating * m.totalRatings,
    0
  )
  return Math.round((weightedSum / totalRatings) * 10) / 10
}

/**
 * Format revenue for display.
 *
 * @param cents - Revenue in cents
 * @param currency - Currency code (default USD)
 * @returns Formatted string like "$1,234.56"
 */
export function formatRevenue(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

/**
 * Group reviews by rating.
 *
 * @param reviews - Array of reviews
 * @returns Object with ratings as keys and counts as values
 */
export function groupReviewsByRating(
  reviews: AppReview[]
): Record<number, number> {
  const groups: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  reviews.forEach((review) => {
    const rating = Math.min(5, Math.max(1, Math.round(review.rating)))
    groups[rating]++
  })

  return groups
}

/**
 * Get recent reviews that need responses.
 *
 * @param reviews - Array of reviews
 * @param maxRating - Only include reviews at or below this rating
 * @returns Reviews without responses, sorted by date
 */
export function getReviewsNeedingResponse(
  reviews: AppReview[],
  maxRating = 3
): AppReview[] {
  return reviews
    .filter((r) => r.rating <= maxRating && !r.response)
    .sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime())
}
