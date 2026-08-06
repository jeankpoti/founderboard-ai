/**
 * Intercom Mock Data Factory
 *
 * Generates realistic Intercom conversations and metrics.
 */

import type { IntercomConversation, IntercomMetrics } from '@/types/integrations'
import {
  generateId,
  generateDateRange,
  randomBetween,
  randomFloat,
  randomPick,
  daysAgo,
  MOCK_ORG_ID,
  MOCK_INTEGRATION_PREFIX,
  MOCK_TEAM_MEMBERS,
} from '../utils'

const INTERCOM_INTEGRATION_ID = `${MOCK_INTEGRATION_PREFIX}-intercom`

/**
 * Conversation subjects.
 */
const SUBJECTS = [
  'How do I connect Stripe integration?',
  'Dashboard not loading properly',
  'Question about pricing plans',
  'Feature request: export to PDF',
  'Login issues after password reset',
  'Need help with API setup',
  'Billing question - invoice needed',
  'How to add team members?',
  'Integration sync not working',
  'Request to upgrade plan',
  'Bug report: charts not displaying',
  'Question about data retention',
  'Help with custom metrics',
  'Mobile app availability?',
  'How to cancel subscription?',
  'SSO configuration help',
  'Webhook setup assistance',
  'Data import question',
  'Account migration request',
  'Custom report creation',
]

/**
 * Customer names and companies.
 */
const CUSTOMERS = [
  { name: 'John Smith', email: 'john@acmecorp.com' },
  { name: 'Emily Chen', email: 'emily@techstartup.io' },
  { name: 'Michael Brown', email: 'michael@digitalsolutions.co' },
  { name: 'Sarah Johnson', email: 'sarah@cloudbase.com' },
  { name: 'David Lee', email: 'david@innovationlabs.io' },
  { name: 'Jessica Martinez', email: 'jessica@dataflow.co' },
  { name: 'Chris Wilson', email: 'chris@appworks.io' },
  { name: 'Amanda Taylor', email: 'amanda@codecraft.dev' },
  { name: 'Ryan Anderson', email: 'ryan@scaleup.io' },
  { name: 'Lisa Thompson', email: 'lisa@growthco.com' },
]

/**
 * Generate realistic Intercom conversations.
 */
export function generateIntercomConversations(count: number = 25): IntercomConversation[] {
  const conversations: IntercomConversation[] = []

  for (let i = 0; i < count; i++) {
    const customer = randomPick(CUSTOMERS)
    const status = generateConversationStatus()
    const assignee = status !== 'open' ? randomPick(MOCK_TEAM_MEMBERS) : null
    const daysAgoValue = randomBetween(0, 30)
    const createdAt = daysAgo(daysAgoValue)

    const conversation: IntercomConversation = {
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: INTERCOM_INTEGRATION_ID,
      externalId: `conv_${generateId().slice(0, 8)}`,
      subject: randomPick(SUBJECTS),
      customerName: customer.name,
      customerEmail: customer.email,
      assigneeName: assignee?.name,
      status,
      messageCount: randomBetween(2, 15),
      createdAt,
      updatedAt: daysAgo(Math.max(0, daysAgoValue - randomBetween(0, 3))),
      fetchedAt: new Date().toISOString(),
    }

    // Add response time for non-open conversations
    if (status !== 'open') {
      conversation.firstResponseTime = randomBetween(5, 120) // 5 min to 2 hours
    }

    // Add resolution time for resolved/closed conversations
    if (status === 'resolved' || status === 'closed') {
      conversation.resolutionTime = randomBetween(30, 1440) // 30 min to 24 hours
    }

    // Add rating for some resolved conversations
    if (status === 'resolved' && Math.random() > 0.5) {
      conversation.rating = generateRating()
    }

    conversations.push(conversation)
  }

  return conversations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Generate realistic Intercom metrics for the last N days.
 */
export function generateIntercomMetrics(days: number = 30): IntercomMetrics[] {
  const dates = generateDateRange(days)
  const metrics: IntercomMetrics[] = []

  dates.forEach((period) => {
    const dayOfWeek = new Date(period).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // Less conversations on weekends
    const baseConversations = isWeekend ? 15 : 35
    const totalConversations = randomBetween(
      Math.floor(baseConversations * 0.7),
      Math.floor(baseConversations * 1.3)
    )

    const resolvedConversations = Math.floor(totalConversations * randomFloat(0.7, 0.9))
    const openConversations = totalConversations - resolvedConversations

    metrics.push({
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: INTERCOM_INTEGRATION_ID,
      period,
      totalConversations,
      openConversations,
      resolvedConversations,
      avgFirstResponseTime: randomBetween(10, 45), // 10-45 minutes
      avgResolutionTime: randomBetween(120, 480), // 2-8 hours
      satisfactionScore: randomFloat(85, 98),
      fetchedAt: new Date().toISOString(),
    })
  })

  return metrics
}

/**
 * Generate a weighted conversation status.
 */
function generateConversationStatus(): IntercomConversation['status'] {
  const rand = Math.random()
  if (rand < 0.50) return 'resolved'
  if (rand < 0.70) return 'closed'
  if (rand < 0.85) return 'pending'
  return 'open'
}

/**
 * Generate a weighted rating (mostly positive).
 */
function generateRating(): number {
  const rand = Math.random()
  if (rand < 0.60) return 5
  if (rand < 0.85) return 4
  if (rand < 0.95) return 3
  return randomBetween(1, 2)
}
