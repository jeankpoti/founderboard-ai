/**
 * PostHog Mock Data Factory
 *
 * Generates realistic PostHog events, funnels, and retention data.
 */

import type { PostHogEvent, PostHogFunnel, PostHogRetention } from '@/types/integrations'
import {
  generateId,
  generateDateRange,
  randomBetween,
  randomFloat,
  MOCK_ORG_ID,
  MOCK_INTEGRATION_PREFIX,
} from '../utils'

const POSTHOG_INTEGRATION_ID = `${MOCK_INTEGRATION_PREFIX}-posthog`

/**
 * Event definitions with typical counts.
 */
const EVENTS = [
  { name: '$pageview', baseCount: 50000, baseUsers: 8000 },
  { name: '$autocapture', baseCount: 120000, baseUsers: 7500 },
  { name: 'sign_up_started', baseCount: 2500, baseUsers: 2500 },
  { name: 'sign_up_completed', baseCount: 1800, baseUsers: 1800 },
  { name: 'login', baseCount: 15000, baseUsers: 4500 },
  { name: 'dashboard_viewed', baseCount: 25000, baseUsers: 5000 },
  { name: 'integration_connected', baseCount: 800, baseUsers: 600 },
  { name: 'metric_created', baseCount: 3500, baseUsers: 2000 },
  { name: 'report_generated', baseCount: 1200, baseUsers: 800 },
  { name: 'export_clicked', baseCount: 600, baseUsers: 400 },
  { name: 'settings_updated', baseCount: 900, baseUsers: 700 },
  { name: 'team_member_invited', baseCount: 350, baseUsers: 250 },
  { name: 'subscription_started', baseCount: 180, baseUsers: 180 },
  { name: 'feature_flag_evaluated', baseCount: 80000, baseUsers: 6000 },
]

/**
 * Generate realistic PostHog events for the period.
 */
export function generatePostHogEvents(days: number = 30): PostHogEvent[] {
  const latestDate = generateDateRange(1)[0]

  return EVENTS.map((event) => ({
    id: generateId(),
    orgId: MOCK_ORG_ID,
    integrationId: POSTHOG_INTEGRATION_ID,
    name: event.name,
    eventCount: Math.floor(event.baseCount * randomFloat(0.8, 1.2) * (days / 30)),
    uniqueUsers: Math.floor(event.baseUsers * randomFloat(0.8, 1.2) * (days / 30)),
    period: latestDate,
    fetchedAt: new Date().toISOString(),
  }))
}

/**
 * Generate realistic PostHog funnels.
 */
export function generatePostHogFunnels(): PostHogFunnel[] {
  const latestDate = generateDateRange(1)[0]

  return [
    {
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: POSTHOG_INTEGRATION_ID,
      name: 'Sign Up Funnel',
      conversionRate: randomFloat(65, 75),
      steps: [
        { name: 'Landing Page Visit', count: 10000, dropoff: 0 },
        { name: 'Sign Up Started', count: 4500, dropoff: 55 },
        { name: 'Email Verified', count: 3200, dropoff: 29 },
        { name: 'Profile Completed', count: 2800, dropoff: 12 },
        { name: 'First Dashboard View', count: 2500, dropoff: 11 },
      ],
      period: latestDate,
      fetchedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: POSTHOG_INTEGRATION_ID,
      name: 'Onboarding Funnel',
      conversionRate: randomFloat(55, 65),
      steps: [
        { name: 'Onboarding Started', count: 2500, dropoff: 0 },
        { name: 'First Integration Connected', count: 1800, dropoff: 28 },
        { name: 'First Metric Created', count: 1500, dropoff: 17 },
        { name: 'Dashboard Customized', count: 1200, dropoff: 20 },
        { name: 'Onboarding Completed', count: 1000, dropoff: 17 },
      ],
      period: latestDate,
      fetchedAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: POSTHOG_INTEGRATION_ID,
      name: 'Subscription Funnel',
      conversionRate: randomFloat(8, 15),
      steps: [
        { name: 'Pricing Page View', count: 5000, dropoff: 0 },
        { name: 'Plan Selected', count: 1500, dropoff: 70 },
        { name: 'Checkout Started', count: 800, dropoff: 47 },
        { name: 'Payment Completed', count: 450, dropoff: 44 },
      ],
      period: latestDate,
      fetchedAt: new Date().toISOString(),
    },
  ]
}

/**
 * Generate realistic PostHog retention cohorts.
 */
export function generatePostHogRetention(weeks: number = 8): PostHogRetention[] {
  const retention: PostHogRetention[] = []

  for (let i = weeks - 1; i >= 0; i--) {
    const cohortDate = new Date()
    cohortDate.setDate(cohortDate.getDate() - i * 7)

    // Earlier cohorts have more complete data
    // Day 1 retention: 40-50%
    // Day 7 retention: 25-35%
    // Day 14 retention: 18-28%
    // Day 30 retention: 12-22%

    const day0Users = randomBetween(400, 600)

    retention.push({
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: POSTHOG_INTEGRATION_ID,
      cohortDate: cohortDate.toISOString().split('T')[0],
      day0Users,
      day1: i >= 1 ? randomFloat(40, 50) : 0,
      day7: i >= 7 ? randomFloat(25, 35) : 0,
      day14: i >= 14 ? randomFloat(18, 28) : 0,
      day30: i >= 30 ? randomFloat(12, 22) : 0,
      fetchedAt: new Date().toISOString(),
    })
  }

  return retention
}
