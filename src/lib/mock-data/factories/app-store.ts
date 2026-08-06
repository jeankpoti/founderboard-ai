/**
 * App Store Mock Data Factory
 *
 * Generates realistic App Store metrics and reviews.
 */

import type { AppStoreMetrics, AppReview } from '@/types/integrations'
import {
  generateId,
  generateDateRange,
  randomBetween,
  randomFloat,
  randomPick,
  daysAgo,
  generateTrendingValue,
  MOCK_ORG_ID,
  MOCK_INTEGRATION_PREFIX,
} from '../utils'

const APP_STORE_INTEGRATION_ID = `${MOCK_INTEGRATION_PREFIX}-app-store`
const APP_ID = 'com.founderboard.app'
const APP_NAME = 'Founderboard'

/**
 * Generate realistic App Store metrics for the last N days.
 */
export function generateAppStoreMetrics(days: number = 30): AppStoreMetrics[] {
  const dates = generateDateRange(days)
  const metrics: AppStoreMetrics[] = []

  // Base values
  const baseDownloads = 1500
  const baseRevenue = 250000 // $2,500 in cents
  let activeDevices = 85000
  let totalRatings = 12500

  dates.forEach((period, index) => {
    // Generate daily values with upward trend
    const downloads = generateTrendingValue(baseDownloads, index, days, 0.2)
    const newDownloads = Math.floor(downloads * 0.7)
    const redownloads = Math.floor(downloads * 0.2)
    const updates = Math.floor(downloads * 0.1)

    // Revenue with weekend dips
    const dayOfWeek = new Date(period).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const revenueMultiplier = isWeekend ? 0.7 : 1.0
    const revenue = Math.floor(generateTrendingValue(baseRevenue, index, days, 0.15) * revenueMultiplier)

    // Active devices grow steadily
    activeDevices += randomBetween(100, 500)
    totalRatings += randomBetween(5, 20)

    metrics.push({
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: APP_STORE_INTEGRATION_ID,
      appId: APP_ID,
      appName: APP_NAME,
      platform: 'ios',
      period,
      downloads,
      newDownloads,
      redownloads,
      updates,
      revenue,
      currency: 'USD',
      activeDevices,
      crashFreeRate: randomFloat(99.2, 99.9, 1),
      averageRating: randomFloat(4.5, 4.8, 1),
      totalRatings,
      fetchedAt: new Date().toISOString(),
    })
  })

  return metrics
}

/**
 * Review titles and bodies for realistic reviews.
 */
const POSITIVE_REVIEWS = [
  { title: 'Best founder tool ever!', body: 'This app has completely transformed how I manage my startup. The dashboard is beautiful and the insights are invaluable.' },
  { title: 'Game changer for startups', body: 'Finally an app that understands what founders need. The integration with Stripe and GitHub saves me hours every week.' },
  { title: 'Love the AI features', body: 'The AI-powered insights are incredibly helpful. It feels like having a data analyst on my team.' },
  { title: 'Essential for any founder', body: 'Clean interface, powerful features, and great support. Highly recommend to any startup founder.' },
  { title: 'Worth every penny', body: 'The time I save with this app more than pays for itself. The revenue tracking alone is worth it.' },
  { title: 'Excellent app!', body: 'Easy to set up, great integrations, and the charts are beautiful. Exactly what I was looking for.' },
  { title: 'Perfect for tracking metrics', body: 'Love how it pulls all my data into one place. No more switching between multiple dashboards.' },
]

const NEUTRAL_REVIEWS = [
  { title: 'Good but needs work', body: 'The app is useful but could use more customization options. Looking forward to future updates.' },
  { title: 'Solid app overall', body: 'Does what it says. Would love to see more integrations added in future versions.' },
  { title: 'Pretty good', body: 'Nice app for tracking startup metrics. A few bugs here and there but nothing major.' },
]

const NEGATIVE_REVIEWS = [
  { title: 'Needs improvement', body: 'The concept is great but the execution needs work. Sync issues with some integrations.' },
  { title: 'Too expensive', body: 'Good features but the pricing is steep for early-stage startups. Would use more if cheaper.' },
]

/**
 * Reviewer names.
 */
const REVIEWER_NAMES = [
  'TechFounder2024', 'StartupSarah', 'DevEntrepreneur', 'ScaleupSteve',
  'InnovatorAnna', 'GrowthGuru', 'CodeCEO', 'DataDrivenDave',
  'LaunchLisa', 'MetricsMike', 'VCReadyVince', 'PitchPerfect',
]

/**
 * Generate realistic App Store reviews.
 */
export function generateAppReviews(count: number = 20): AppReview[] {
  const reviews: AppReview[] = []
  const versions = ['2.1.0', '2.0.5', '2.0.4', '2.0.3', '2.0.0', '1.9.8']

  for (let i = 0; i < count; i++) {
    const rating = generateRating()
    const review = getReviewForRating(rating)
    const daysAgoValue = randomBetween(0, 90)

    reviews.push({
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: APP_STORE_INTEGRATION_ID,
      appId: APP_ID,
      platform: 'ios',
      externalId: `review_${generateId().slice(0, 8)}`,
      rating,
      title: review.title,
      body: review.body,
      authorName: randomPick(REVIEWER_NAMES),
      appVersion: randomPick(versions),
      reviewDate: daysAgo(daysAgoValue),
      fetchedAt: new Date().toISOString(),
    })
  }

  return reviews.sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime())
}

/**
 * Generate a weighted rating (mostly positive).
 */
function generateRating(): number {
  const rand = Math.random()
  if (rand < 0.50) return 5
  if (rand < 0.80) return 4
  if (rand < 0.90) return 3
  if (rand < 0.95) return 2
  return 1
}

/**
 * Get a review appropriate for the rating.
 */
function getReviewForRating(rating: number): { title: string; body: string } {
  if (rating >= 4) return randomPick(POSITIVE_REVIEWS)
  if (rating === 3) return randomPick(NEUTRAL_REVIEWS)
  return randomPick(NEGATIVE_REVIEWS)
}
