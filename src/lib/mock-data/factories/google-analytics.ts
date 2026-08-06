/**
 * Google Analytics Mock Data Factory
 *
 * Generates realistic Google Analytics metrics, pages, and traffic sources.
 */

import type {
  GoogleAnalyticsMetrics,
  GoogleAnalyticsPageView,
  GoogleAnalyticsTrafficSource,
} from '@/types/integrations'
import {
  generateId,
  generateDateRange,
  randomBetween,
  randomFloat,
  generateTrendingValue,
  MOCK_ORG_ID,
  MOCK_INTEGRATION_PREFIX,
} from '../utils'

const GA_INTEGRATION_ID = `${MOCK_INTEGRATION_PREFIX}-google-analytics`

/**
 * Generate realistic Google Analytics metrics for the last N days.
 */
export function generateGoogleAnalyticsMetrics(days: number = 30): GoogleAnalyticsMetrics[] {
  const dates = generateDateRange(days)
  const metrics: GoogleAnalyticsMetrics[] = []

  // Base values
  const baseSessions = 3500
  const baseUsers = 2800

  dates.forEach((period, index) => {
    // Generate values with natural variation
    const dayOfWeek = new Date(period).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // Weekends typically have less traffic for B2B
    const weekendMultiplier = isWeekend ? 0.6 : 1.0

    const sessions = Math.floor(generateTrendingValue(baseSessions, index, days, 0.15) * weekendMultiplier)
    const users = Math.floor(generateTrendingValue(baseUsers, index, days, 0.15) * weekendMultiplier)
    const newUsers = Math.floor(users * randomFloat(0.3, 0.5))
    const pageviews = Math.floor(sessions * randomFloat(2.5, 4.0))

    metrics.push({
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: GA_INTEGRATION_ID,
      period,
      sessions,
      users,
      newUsers,
      pageviews,
      bounceRate: randomFloat(35, 55),
      avgSessionDuration: randomBetween(120, 300), // 2-5 minutes
      pagesPerSession: randomFloat(2.5, 4.5, 1),
      fetchedAt: new Date().toISOString(),
    })
  })

  return metrics
}

/**
 * Page definitions with typical traffic distribution.
 */
const PAGES = [
  { path: '/', title: 'Home - Founderboard', weight: 25 },
  { path: '/pricing', title: 'Pricing - Founderboard', weight: 15 },
  { path: '/features', title: 'Features - Founderboard', weight: 12 },
  { path: '/blog', title: 'Blog - Founderboard', weight: 10 },
  { path: '/about', title: 'About Us - Founderboard', weight: 8 },
  { path: '/docs', title: 'Documentation - Founderboard', weight: 8 },
  { path: '/login', title: 'Login - Founderboard', weight: 7 },
  { path: '/signup', title: 'Sign Up - Founderboard', weight: 6 },
  { path: '/integrations', title: 'Integrations - Founderboard', weight: 5 },
  { path: '/contact', title: 'Contact - Founderboard', weight: 4 },
]

/**
 * Generate realistic page view data.
 */
export function generateGoogleAnalyticsPages(days: number = 30): GoogleAnalyticsPageView[] {
  const latestDate = generateDateRange(1)[0]
  const pages: GoogleAnalyticsPageView[] = []

  // Total pageviews to distribute
  const totalPageviews = days * 12000 // ~12k pageviews per day
  const totalWeight = PAGES.reduce((sum, p) => sum + p.weight, 0)

  PAGES.forEach((page) => {
    const pageviews = Math.floor((page.weight / totalWeight) * totalPageviews)
    const uniquePageviews = Math.floor(pageviews * randomFloat(0.6, 0.8))

    pages.push({
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: GA_INTEGRATION_ID,
      period: latestDate,
      pagePath: page.path,
      pageTitle: page.title,
      pageviews,
      uniquePageviews,
      avgTimeOnPage: randomBetween(30, 180), // 30 seconds to 3 minutes
      bounceRate: page.path === '/' ? randomFloat(45, 60) : randomFloat(25, 50),
      fetchedAt: new Date().toISOString(),
    })
  })

  // Sort by pageviews descending
  return pages.sort((a, b) => b.pageviews - a.pageviews)
}

/**
 * Traffic source definitions with typical distribution.
 */
const TRAFFIC_SOURCES = [
  { source: 'google', medium: 'organic', weight: 35 },
  { source: '(direct)', medium: '(none)', weight: 25 },
  { source: 'twitter', medium: 'social', weight: 10 },
  { source: 'linkedin', medium: 'social', weight: 8 },
  { source: 'google', medium: 'cpc', weight: 7 },
  { source: 'producthunt', medium: 'referral', weight: 5 },
  { source: 'github', medium: 'referral', weight: 4 },
  { source: 'hackernews', medium: 'referral', weight: 3 },
  { source: 'newsletter', medium: 'email', weight: 3 },
]

/**
 * Generate realistic traffic source data.
 */
export function generateGoogleAnalyticsSources(days: number = 30): GoogleAnalyticsTrafficSource[] {
  const latestDate = generateDateRange(1)[0]
  const sources: GoogleAnalyticsTrafficSource[] = []

  // Total sessions to distribute
  const totalSessions = days * 3500
  const totalWeight = TRAFFIC_SOURCES.reduce((sum, s) => sum + s.weight, 0)

  TRAFFIC_SOURCES.forEach((trafficSource) => {
    const sessions = Math.floor((trafficSource.weight / totalWeight) * totalSessions)
    const users = Math.floor(sessions * randomFloat(0.7, 0.9))

    sources.push({
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: GA_INTEGRATION_ID,
      period: latestDate,
      source: trafficSource.source,
      medium: trafficSource.medium,
      sessions,
      users,
      bounceRate: randomFloat(30, 60),
      conversionRate: randomFloat(1.5, 8.0, 1),
      fetchedAt: new Date().toISOString(),
    })
  })

  // Sort by sessions descending
  return sources.sort((a, b) => b.sessions - a.sessions)
}
