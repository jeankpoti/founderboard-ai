/**
 * Linear Mock Data Factory
 *
 * Generates realistic Linear issues for dev insights.
 */

import type { LinearIssue } from '@/types/integrations'
import {
  generateId,
  randomBetween,
  randomPick,
  randomPickMultiple,
  daysAgo,
  MOCK_ORG_ID,
  MOCK_INTEGRATION_PREFIX,
  MOCK_TEAM_MEMBERS,
} from '../utils'

const LINEAR_INTEGRATION_ID = `${MOCK_INTEGRATION_PREFIX}-linear`
const TEAM_NAME = 'Engineering'

/**
 * Issue titles for realistic Linear issues.
 */
const ISSUE_TITLES = [
  'Implement user authentication flow',
  'Add dashboard analytics widgets',
  'Fix performance issues in metrics loading',
  'Implement dark mode theme',
  'Add export to CSV functionality',
  'Refactor API client architecture',
  'Implement real-time data sync',
  'Add keyboard shortcuts',
  'Fix mobile responsive issues',
  'Implement search functionality',
  'Add integration settings page',
  'Optimize database queries',
  'Implement rate limiting',
  'Add user onboarding flow',
  'Fix date formatting bugs',
  'Implement webhook handling',
  'Add activity logging',
  'Improve error messages',
  'Implement caching layer',
  'Add notification system',
  'Fix memory leak in charts',
  'Implement SSO authentication',
  'Add bulk operations',
  'Improve loading states',
  'Fix timezone handling',
  'Implement role-based access',
  'Add data backup feature',
  'Optimize bundle size',
  'Implement undo/redo',
  'Add multi-language support',
]

/**
 * Project names.
 */
const PROJECTS = ['Dashboard', 'API', 'Mobile', 'Infrastructure', 'Integrations']

/**
 * Labels.
 */
const LABELS = ['bug', 'feature', 'improvement', 'tech-debt', 'urgent', 'blocked']

/**
 * Generate realistic Linear issues.
 */
export function generateLinearIssues(count: number = 30): LinearIssue[] {
  const issues: LinearIssue[] = []

  for (let i = 0; i < count; i++) {
    const state = generateIssueState()
    const assignee = Math.random() > 0.2 ? randomPick(MOCK_TEAM_MEMBERS) : null
    const daysAgoValue = randomBetween(0, 60)
    const createdAt = daysAgo(daysAgoValue)

    const issue: LinearIssue = {
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: LINEAR_INTEGRATION_ID,
      externalId: generateId().slice(0, 8),
      identifier: `ENG-${100 + i}`,
      title: randomPick(ISSUE_TITLES),
      description: 'Detailed description of the task with requirements and acceptance criteria.',
      state,
      priority: randomBetween(1, 4),
      assigneeName: assignee?.name,
      assigneeAvatar: assignee?.avatar,
      teamName: TEAM_NAME,
      projectName: randomPick(PROJECTS),
      labels: randomPickMultiple(LABELS, randomBetween(0, 2)),
      estimate: randomPick([1, 2, 3, 5, 8, null]),
      createdAt,
      fetchedAt: new Date().toISOString(),
    }

    // Add due date for some issues
    if (Math.random() > 0.6) {
      const dueDaysAhead = randomBetween(-5, 14) // Some overdue
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + dueDaysAhead)
      issue.dueDate = dueDate.toISOString().split('T')[0]
    }

    // Add completed date for done/canceled issues
    if (state === 'done' || state === 'canceled') {
      issue.completedAt = daysAgo(Math.max(0, daysAgoValue - randomBetween(1, 10)))
    }

    issues.push(issue)
  }

  return issues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Generate a weighted issue state.
 */
function generateIssueState(): LinearIssue['state'] {
  const rand = Math.random()
  if (rand < 0.30) return 'done'
  if (rand < 0.50) return 'in_progress'
  if (rand < 0.70) return 'todo'
  if (rand < 0.95) return 'backlog'
  return 'canceled'
}

/**
 * Get summary statistics from issues.
 */
export function getLinearStats(issues: LinearIssue[]): {
  total: number
  byState: Record<LinearIssue['state'], number>
  velocity: number
} {
  const byState = {
    backlog: 0,
    todo: 0,
    in_progress: 0,
    done: 0,
    canceled: 0,
  }

  issues.forEach((issue) => {
    byState[issue.state]++
  })

  // Velocity = done issues with estimates in last 2 weeks
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const velocity = issues
    .filter(
      (i) =>
        i.state === 'done' &&
        i.completedAt &&
        new Date(i.completedAt) >= twoWeeksAgo &&
        i.estimate
    )
    .reduce((sum, i) => sum + (i.estimate || 0), 0)

  return {
    total: issues.length,
    byState,
    velocity,
  }
}
