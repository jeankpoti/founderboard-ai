/**
 * Mock Data Factories Index
 *
 * Re-exports all mock data generators.
 */

// Stripe
export { generateStripeMetrics, generateStripeCharges } from './stripe'

// GitHub
export {
  generateGitHubCommits,
  generateGitHubPullRequests,
  generateGitHubIssues,
} from './github'

// App Store
export { generateAppStoreMetrics, generateAppReviews } from './app-store'

// Google Analytics
export {
  generateGoogleAnalyticsMetrics,
  generateGoogleAnalyticsPages,
  generateGoogleAnalyticsSources,
} from './google-analytics'

// Linear
export { generateLinearIssues, getLinearStats } from './linear'

// PostHog
export {
  generatePostHogEvents,
  generatePostHogFunnels,
  generatePostHogRetention,
} from './posthog'

// Intercom
export { generateIntercomConversations, generateIntercomMetrics } from './intercom'

// Dashboard KPI Metrics
export { generateMetrics, generateMetricSnapshots } from './metrics'
