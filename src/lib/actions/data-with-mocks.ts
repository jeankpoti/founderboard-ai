'use server'

/**
 * Data Actions with Mock Fallback
 *
 * These actions automatically return mock data when integrations are not connected,
 * and real data when they are. This provides a seamless demo experience for recruiters
 * while giving real users their actual data.
 *
 * Usage:
 * - Import from this file instead of '@/lib/actions/integrations'
 * - Functions have the same return types but don't require integrationId
 */

import type { ApiResponse } from '@/types/api'
import type {
  StripeMetrics,
  StripeCharge,
  GitHubCommit,
  GitHubPullRequest,
  GitHubIssue,
  AppStoreMetrics,
  AppReview,
  LinearIssue,
  GoogleAnalyticsMetrics,
  GoogleAnalyticsPageView,
  GoogleAnalyticsTrafficSource,
  PostHogEvent,
  PostHogFunnel,
  PostHogRetention,
  IntercomConversation,
  IntercomMetrics,
} from '@/types/integrations'

import {
  getIntegrations,
  getStripeMetrics,
  getStripeCharges,
  getGitHubCommits,
  getGitHubPullRequests,
  getGitHubIssues,
  getAppStoreMetrics,
  getAppReviews,
  getLinearIssues,
  getGoogleAnalyticsMetrics,
  getGoogleAnalyticsPages,
  getGoogleAnalyticsSources,
  getPostHogEvents,
  getPostHogFunnels,
  getPostHogRetention,
  getIntercomConversations,
  getIntercomMetrics,
} from './integrations'

import { isIntegrationConnected, getActiveIntegrationId } from '@/lib/mock-data/utils'
import {
  generateStripeMetrics,
  generateStripeCharges,
  generateGitHubCommits,
  generateGitHubPullRequests,
  generateGitHubIssues,
  generateAppStoreMetrics,
  generateAppReviews,
  generateLinearIssues,
  generateGoogleAnalyticsMetrics,
  generateGoogleAnalyticsPages,
  generateGoogleAnalyticsSources,
  generatePostHogEvents,
  generatePostHogFunnels,
  generatePostHogRetention,
  generateIntercomConversations,
  generateIntercomMetrics,
} from '@/lib/mock-data/factories'

// ========================================
// HELPERS
// ========================================

/**
 * Convert days number to start date string (YYYY-MM-DD format).
 */
function daysToStartDate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

// ========================================
// STRIPE DATA
// ========================================

/**
 * Get Stripe metrics - returns mock data if Stripe not connected.
 */
export async function getStripeMetricsWithMock(
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<StripeMetrics[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    // Can't check integrations, return mock data
    return { success: true, data: generateStripeMetrics(30) }
  }

  const integrations = integrationsResult.data
  const stripeIntegrationId = getActiveIntegrationId(integrations, 'stripe')

  if (!stripeIntegrationId) {
    // No Stripe integration, return mock data
    return { success: true, data: generateStripeMetrics(30) }
  }

  // Stripe connected, get real data
  return getStripeMetrics(stripeIntegrationId, startDate, endDate)
}

/**
 * Get Stripe charges - returns mock data if Stripe not connected.
 */
export async function getStripeChargesWithMock(
  limit: number = 25
): Promise<ApiResponse<StripeCharge[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return { success: true, data: generateStripeCharges(limit) }
  }

  const integrations = integrationsResult.data
  const stripeIntegrationId = getActiveIntegrationId(integrations, 'stripe')

  if (!stripeIntegrationId) {
    return { success: true, data: generateStripeCharges(limit) }
  }

  return getStripeCharges(stripeIntegrationId, limit)
}

// ========================================
// GITHUB DATA
// ========================================

/**
 * Get GitHub commits - returns mock data if GitHub not connected.
 */
export async function getGitHubCommitsWithMock(
  limit: number = 50
): Promise<ApiResponse<GitHubCommit[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return { success: true, data: generateGitHubCommits(limit) }
  }

  const integrations = integrationsResult.data
  const githubIntegrationId = getActiveIntegrationId(integrations, 'github')

  if (!githubIntegrationId) {
    return { success: true, data: generateGitHubCommits(limit) }
  }

  return getGitHubCommits(githubIntegrationId, limit)
}

/**
 * Get GitHub pull requests - returns mock data if GitHub not connected.
 */
export async function getGitHubPullRequestsWithMock(
  limit: number = 20
): Promise<ApiResponse<GitHubPullRequest[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return { success: true, data: generateGitHubPullRequests(limit) }
  }

  const integrations = integrationsResult.data
  const githubIntegrationId = getActiveIntegrationId(integrations, 'github')

  if (!githubIntegrationId) {
    return { success: true, data: generateGitHubPullRequests(limit) }
  }

  return getGitHubPullRequests(githubIntegrationId, limit)
}

/**
 * Get GitHub issues - returns mock data if GitHub not connected.
 */
export async function getGitHubIssuesWithMock(
  limit: number = 30
): Promise<ApiResponse<GitHubIssue[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return { success: true, data: generateGitHubIssues(limit) }
  }

  const integrations = integrationsResult.data
  const githubIntegrationId = getActiveIntegrationId(integrations, 'github')

  if (!githubIntegrationId) {
    return { success: true, data: generateGitHubIssues(limit) }
  }

  return getGitHubIssues(githubIntegrationId, limit)
}

// ========================================
// APP STORE DATA
// ========================================

/**
 * Get App Store metrics - returns mock data if App Store not connected.
 */
export async function getAppStoreMetricsWithMock(
  days: number = 30
): Promise<ApiResponse<AppStoreMetrics[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return { success: true, data: generateAppStoreMetrics(days) }
  }

  const integrations = integrationsResult.data
  const appStoreIntegrationId = getActiveIntegrationId(integrations, 'app_store_connect')

  if (!appStoreIntegrationId) {
    return { success: true, data: generateAppStoreMetrics(days) }
  }

  return getAppStoreMetrics(appStoreIntegrationId, daysToStartDate(days))
}

/**
 * Get App Store reviews - returns mock data if App Store not connected.
 */
export async function getAppReviewsWithMock(
  limit: number = 20
): Promise<ApiResponse<AppReview[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return { success: true, data: generateAppReviews(limit) }
  }

  const integrations = integrationsResult.data
  const appStoreIntegrationId = getActiveIntegrationId(integrations, 'app_store_connect')

  if (!appStoreIntegrationId) {
    return { success: true, data: generateAppReviews(limit) }
  }

  return getAppReviews(appStoreIntegrationId, limit)
}

// ========================================
// LINEAR DATA
// ========================================

/**
 * Get Linear issues - returns mock data if Linear not connected.
 */
export async function getLinearIssuesWithMock(
  limit: number = 30
): Promise<ApiResponse<LinearIssue[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return { success: true, data: generateLinearIssues(limit) }
  }

  const integrations = integrationsResult.data
  const linearIntegrationId = getActiveIntegrationId(integrations, 'linear')

  if (!linearIntegrationId) {
    return { success: true, data: generateLinearIssues(limit) }
  }

  return getLinearIssues(linearIntegrationId, limit)
}

// ========================================
// GOOGLE ANALYTICS DATA
// ========================================

/**
 * Get Google Analytics metrics - returns mock data if GA not connected.
 */
export async function getGoogleAnalyticsMetricsWithMock(
  days: number = 30
): Promise<ApiResponse<GoogleAnalyticsMetrics[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return { success: true, data: generateGoogleAnalyticsMetrics(days) }
  }

  const integrations = integrationsResult.data
  const gaIntegrationId = getActiveIntegrationId(integrations, 'google_analytics')

  if (!gaIntegrationId) {
    return { success: true, data: generateGoogleAnalyticsMetrics(days) }
  }

  return getGoogleAnalyticsMetrics(gaIntegrationId, daysToStartDate(days))
}

/**
 * Get Google Analytics pages - returns mock data if GA not connected.
 */
export async function getGoogleAnalyticsPagesWithMock(
  days: number = 30
): Promise<ApiResponse<GoogleAnalyticsPageView[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return { success: true, data: generateGoogleAnalyticsPages(days) }
  }

  const integrations = integrationsResult.data
  const gaIntegrationId = getActiveIntegrationId(integrations, 'google_analytics')

  if (!gaIntegrationId) {
    return { success: true, data: generateGoogleAnalyticsPages(days) }
  }

  return getGoogleAnalyticsPages(gaIntegrationId, days)
}

/**
 * Get Google Analytics traffic sources - returns mock data if GA not connected.
 */
export async function getGoogleAnalyticsSourcesWithMock(
  days: number = 30
): Promise<ApiResponse<GoogleAnalyticsTrafficSource[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return { success: true, data: generateGoogleAnalyticsSources(days) }
  }

  const integrations = integrationsResult.data
  const gaIntegrationId = getActiveIntegrationId(integrations, 'google_analytics')

  if (!gaIntegrationId) {
    return { success: true, data: generateGoogleAnalyticsSources(days) }
  }

  return getGoogleAnalyticsSources(gaIntegrationId, days)
}

// ========================================
// POSTHOG DATA
// ========================================

/**
 * Get PostHog events - returns mock data if PostHog not connected.
 */
export async function getPostHogEventsWithMock(
  days: number = 30
): Promise<ApiResponse<PostHogEvent[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return { success: true, data: generatePostHogEvents(days) }
  }

  const integrations = integrationsResult.data
  const posthogIntegrationId = getActiveIntegrationId(integrations, 'posthog')

  if (!posthogIntegrationId) {
    return { success: true, data: generatePostHogEvents(days) }
  }

  return getPostHogEvents(posthogIntegrationId, days)
}

/**
 * Get PostHog funnels - returns mock data if PostHog not connected.
 */
export async function getPostHogFunnelsWithMock(): Promise<ApiResponse<PostHogFunnel[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return { success: true, data: generatePostHogFunnels() }
  }

  const integrations = integrationsResult.data
  const posthogIntegrationId = getActiveIntegrationId(integrations, 'posthog')

  if (!posthogIntegrationId) {
    return { success: true, data: generatePostHogFunnels() }
  }

  return getPostHogFunnels(posthogIntegrationId)
}

/**
 * Get PostHog retention - returns mock data if PostHog not connected.
 */
export async function getPostHogRetentionWithMock(
  weeks: number = 8
): Promise<ApiResponse<PostHogRetention[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return { success: true, data: generatePostHogRetention(weeks) }
  }

  const integrations = integrationsResult.data
  const posthogIntegrationId = getActiveIntegrationId(integrations, 'posthog')

  if (!posthogIntegrationId) {
    return { success: true, data: generatePostHogRetention(weeks) }
  }

  return getPostHogRetention(posthogIntegrationId)
}

// ========================================
// INTERCOM DATA
// ========================================

/**
 * Get Intercom conversations - returns mock data if Intercom not connected.
 */
export async function getIntercomConversationsWithMock(
  limit: number = 25
): Promise<ApiResponse<IntercomConversation[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return { success: true, data: generateIntercomConversations(limit) }
  }

  const integrations = integrationsResult.data
  const intercomIntegrationId = getActiveIntegrationId(integrations, 'intercom')

  if (!intercomIntegrationId) {
    return { success: true, data: generateIntercomConversations(limit) }
  }

  return getIntercomConversations(intercomIntegrationId, limit)
}

/**
 * Get Intercom metrics - returns mock data if Intercom not connected.
 */
export async function getIntercomMetricsWithMock(
  days: number = 30
): Promise<ApiResponse<IntercomMetrics[]>> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return { success: true, data: generateIntercomMetrics(days) }
  }

  const integrations = integrationsResult.data
  const intercomIntegrationId = getActiveIntegrationId(integrations, 'intercom')

  if (!intercomIntegrationId) {
    return { success: true, data: generateIntercomMetrics(days) }
  }

  return getIntercomMetrics(intercomIntegrationId)
}

// ========================================
// HELPER: CHECK IF ANY INTEGRATION IS CONNECTED
// ========================================

/**
 * Check if a specific integration type is connected.
 * Useful for UI to show "Connect" vs "Connected" status.
 */
export async function isIntegrationConnectedAction(
  type: import('@/types/integrations').IntegrationType
): Promise<boolean> {
  const integrationsResult = await getIntegrations()

  if (!integrationsResult.success) {
    return false
  }

  return isIntegrationConnected(integrationsResult.data, type)
}

// ========================================
// DASHBOARD KPI METRICS
// ========================================

import { getMetrics, getMetricSnapshots } from './metrics'
import { generateMetrics, generateMetricSnapshots } from '@/lib/mock-data/factories/metrics'
import type { Metric, MetricSnapshot, MetricType } from '@/types/metrics'

/**
 * Get dashboard KPI metrics - returns mock data if no metrics exist.
 */
export async function getMetricsWithMock(): Promise<ApiResponse<Metric[]>> {
  const result = await getMetrics()

  // If no metrics exist or fetch failed, return mock data
  if (!result.success || result.data.length === 0) {
    return { success: true, data: generateMetrics() }
  }

  return result
}

/**
 * Get metric snapshots for trend charts - returns mock data if no snapshots exist.
 */
export async function getMetricSnapshotsWithMock(
  type: MetricType,
  days: number = 30
): Promise<ApiResponse<MetricSnapshot[]>> {
  const result = await getMetricSnapshots(type, days)

  // If no snapshots exist or fetch failed, return mock data
  if (!result.success || result.data.length === 0) {
    return { success: true, data: generateMetricSnapshots(type, days) }
  }

  return result
}
