/**
 * Stripe Mock Data Factory
 *
 * Generates realistic Stripe metrics and charges for demo purposes.
 */

import type { StripeMetrics, StripeCharge } from '@/types/integrations'
import {
  generateId,
  generateDateRange,
  randomBetween,
  randomPick,
  daysAgo,
  MOCK_ORG_ID,
  MOCK_INTEGRATION_PREFIX,
} from '../utils'

const STRIPE_INTEGRATION_ID = `${MOCK_INTEGRATION_PREFIX}-stripe`

/**
 * Generate realistic Stripe metrics for the last N days.
 *
 * Starting values:
 * - MRR: ~$48,500
 * - Active subscriptions: ~142
 * - Daily growth: 1-3%
 */
export function generateStripeMetrics(days: number = 30): StripeMetrics[] {
  const dates = generateDateRange(days)
  const metrics: StripeMetrics[] = []

  // Start with base values
  let mrr = 4850000 // $48,500 in cents
  let activeSubscriptions = 142

  dates.forEach((period, index) => {
    // Daily variation
    const newSubs = randomBetween(1, 5)
    const canceledSubs = randomBetween(0, 2)
    const mrrGrowth = randomBetween(-5000, 15000) // -$50 to +$150

    // Apply changes (with slight upward trend)
    const trendBonus = Math.floor(index * 500) // ~$5 daily trend
    mrr += mrrGrowth + trendBonus
    activeSubscriptions += newSubs - canceledSubs

    // Ensure positive values
    mrr = Math.max(mrr, 4000000)
    activeSubscriptions = Math.max(activeSubscriptions, 100)

    metrics.push({
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: STRIPE_INTEGRATION_ID,
      period,
      mrr,
      revenue: Math.floor(mrr * randomBetween(95, 115) / 100), // Revenue varies around MRR
      activeSubscriptions,
      newSubscriptions: newSubs,
      canceledSubscriptions: canceledSubs,
      currency: 'USD',
      fetchedAt: new Date().toISOString(),
    })
  })

  return metrics
}

/**
 * Customer names for realistic charges.
 */
const CUSTOMER_NAMES = [
  'Acme Corp',
  'TechStart Inc',
  'Digital Solutions',
  'CloudBase',
  'StartupXYZ',
  'Innovation Labs',
  'DataFlow',
  'AppWorks',
  'CodeCraft',
  'DevHouse',
  'ScaleUp',
  'GrowthCo',
  'NextGen Tech',
  'FutureSoft',
  'SmartBiz',
]

/**
 * Price points for realistic charges.
 */
const PRICE_POINTS = [
  999,    // $9.99 - Starter
  2900,   // $29.00 - Basic
  4900,   // $49.00 - Pro
  9900,   // $99.00 - Team
  19900,  // $199.00 - Business
  49900,  // $499.00 - Enterprise
]

/**
 * Generate realistic Stripe charges.
 */
export function generateStripeCharges(count: number = 25): StripeCharge[] {
  const charges: StripeCharge[] = []

  for (let i = 0; i < count; i++) {
    const daysAgoValue = randomBetween(0, 30)
    const customer = randomPick(CUSTOMER_NAMES)
    const status = generateChargeStatus()
    const amount = randomPick(PRICE_POINTS)

    charges.push({
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: STRIPE_INTEGRATION_ID,
      externalId: `ch_${generateId().replace(/-/g, '').slice(0, 24)}`,
      amount,
      currency: 'USD',
      status,
      customerEmail: `billing@${customer.toLowerCase().replace(/\s+/g, '')}.com`,
      description: getChargeDescription(amount),
      createdAt: daysAgo(daysAgoValue),
      fetchedAt: new Date().toISOString(),
    })
  }

  // Sort by date (most recent first)
  return charges.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Generate a weighted charge status.
 * Most charges should succeed.
 */
function generateChargeStatus(): StripeCharge['status'] {
  const rand = Math.random()
  if (rand < 0.90) return 'succeeded'
  if (rand < 0.95) return 'pending'
  if (rand < 0.98) return 'failed'
  return 'refunded'
}

/**
 * Get a description based on price point.
 */
function getChargeDescription(amount: number): string {
  switch (amount) {
    case 999:
      return 'Founderboard Starter Plan - Monthly'
    case 2900:
      return 'Founderboard Basic Plan - Monthly'
    case 4900:
      return 'Founderboard Pro Plan - Monthly'
    case 9900:
      return 'Founderboard Team Plan - Monthly'
    case 19900:
      return 'Founderboard Business Plan - Monthly'
    case 49900:
      return 'Founderboard Enterprise Plan - Monthly'
    default:
      return 'Founderboard Subscription'
  }
}
