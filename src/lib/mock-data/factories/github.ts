/**
 * GitHub Mock Data Factory
 *
 * Generates realistic GitHub commits, pull requests, and issues.
 */

import type { GitHubCommit, GitHubPullRequest, GitHubIssue } from '@/types/integrations'
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

const GITHUB_INTEGRATION_ID = `${MOCK_INTEGRATION_PREFIX}-github`
const REPOSITORY = 'founderboard/app'

/**
 * Commit message prefixes for conventional commits.
 */
const COMMIT_PREFIXES = ['feat', 'fix', 'chore', 'docs', 'refactor', 'test', 'style', 'perf']

/**
 * Commit message subjects.
 */
const COMMIT_SUBJECTS = [
  'add user authentication flow',
  'implement dashboard charts',
  'update API endpoints',
  'fix navigation bug',
  'improve loading performance',
  'add dark mode support',
  'refactor metrics service',
  'update dependencies',
  'add unit tests for auth',
  'fix mobile responsive layout',
  'implement real-time updates',
  'add integration settings page',
  'fix memory leak in charts',
  'improve error handling',
  'add export functionality',
  'update documentation',
  'fix date formatting issue',
  'add webhook support',
  'improve search performance',
  'fix typo in translations',
  'add analytics tracking',
  'refactor state management',
  'implement caching layer',
  'add notification system',
  'fix race condition',
]

/**
 * Generate realistic GitHub commits.
 */
export function generateGitHubCommits(count: number = 50): GitHubCommit[] {
  const commits: GitHubCommit[] = []
  const branches = ['main', 'develop', 'feature/dashboard', 'feature/auth', 'fix/performance']

  for (let i = 0; i < count; i++) {
    const author = randomPick(MOCK_TEAM_MEMBERS)
    const prefix = randomPick(COMMIT_PREFIXES)
    const subject = randomPick(COMMIT_SUBJECTS)
    const daysAgoValue = Math.floor(i / 3) // ~3 commits per day

    commits.push({
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: GITHUB_INTEGRATION_ID,
      externalId: generateCommitSha(),
      message: `${prefix}: ${subject}`,
      authorName: author.name,
      authorEmail: author.email,
      authorAvatar: author.avatar,
      repository: REPOSITORY,
      branch: randomPick(branches),
      filesChanged: randomBetween(1, 15),
      additions: randomBetween(5, 200),
      deletions: randomBetween(0, 100),
      committedAt: daysAgo(daysAgoValue),
      fetchedAt: new Date().toISOString(),
    })
  }

  return commits.sort((a, b) => new Date(b.committedAt).getTime() - new Date(a.committedAt).getTime())
}

/**
 * PR titles for realistic pull requests.
 */
const PR_TITLES = [
  'Add user authentication with Firebase',
  'Implement dashboard metrics charts',
  'Add dark mode theme support',
  'Refactor API client architecture',
  'Implement real-time notifications',
  'Add integration settings UI',
  'Fix performance issues in data fetching',
  'Implement export to CSV/PDF',
  'Add team collaboration features',
  'Implement search functionality',
  'Add webhook management',
  'Refactor state management to Zustand',
  'Implement caching strategy',
  'Add comprehensive error handling',
  'Implement responsive mobile design',
  'Add unit and integration tests',
  'Implement role-based access control',
  'Add activity logging',
  'Optimize bundle size',
  'Implement rate limiting',
]

/**
 * Generate realistic GitHub pull requests.
 */
export function generateGitHubPullRequests(count: number = 20): GitHubPullRequest[] {
  const prs: GitHubPullRequest[] = []

  for (let i = 0; i < count; i++) {
    const author = randomPick(MOCK_TEAM_MEMBERS)
    const state = generatePRState()
    const daysAgoValue = randomBetween(0, 30)
    const createdAt = daysAgo(daysAgoValue)

    const pr: GitHubPullRequest = {
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: GITHUB_INTEGRATION_ID,
      externalId: `${100 + i}`,
      title: randomPick(PR_TITLES),
      body: 'This PR implements the requested feature with comprehensive tests and documentation.',
      state,
      authorName: author.name,
      authorAvatar: author.avatar,
      repository: REPOSITORY,
      headBranch: `feature/${randomPick(['auth', 'dashboard', 'api', 'ui', 'perf'])}-${randomBetween(100, 999)}`,
      baseBranch: 'main',
      commits: randomBetween(1, 12),
      additions: randomBetween(50, 500),
      deletions: randomBetween(10, 200),
      comments: randomBetween(0, 15),
      createdAt,
      fetchedAt: new Date().toISOString(),
    }

    // Add merged/closed dates for non-open PRs
    if (state === 'merged') {
      pr.mergedAt = daysAgo(Math.max(0, daysAgoValue - randomBetween(1, 5)))
    } else if (state === 'closed') {
      pr.closedAt = daysAgo(Math.max(0, daysAgoValue - randomBetween(1, 3)))
    }

    prs.push(pr)
  }

  return prs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Issue titles for realistic issues.
 */
const ISSUE_TITLES = [
  'Dashboard charts not loading on mobile',
  'Add support for custom date ranges',
  'Improve loading state animations',
  'Add keyboard shortcuts',
  'Memory usage increases over time',
  'Add bulk export functionality',
  'Implement undo/redo for edits',
  'Add more chart visualization types',
  'Improve accessibility (a11y)',
  'Add multi-language support',
  'Implement offline mode',
  'Add data backup feature',
  'Improve onboarding flow',
  'Add widget customization',
  'Implement SSO authentication',
]

/**
 * Issue labels.
 */
const ISSUE_LABELS = ['bug', 'feature', 'enhancement', 'documentation', 'good first issue', 'help wanted', 'priority: high', 'priority: low']

/**
 * Generate realistic GitHub issues.
 */
export function generateGitHubIssues(count: number = 30): GitHubIssue[] {
  const issues: GitHubIssue[] = []

  for (let i = 0; i < count; i++) {
    const author = randomPick(MOCK_TEAM_MEMBERS)
    const state = Math.random() > 0.4 ? 'closed' : 'open'
    const daysAgoValue = randomBetween(0, 60)
    const createdAt = daysAgo(daysAgoValue)

    const issue: GitHubIssue = {
      id: generateId(),
      orgId: MOCK_ORG_ID,
      integrationId: GITHUB_INTEGRATION_ID,
      externalId: `${50 + i}`,
      title: randomPick(ISSUE_TITLES),
      body: 'Detailed description of the issue with steps to reproduce.',
      state,
      authorName: author.name,
      authorAvatar: author.avatar,
      repository: REPOSITORY,
      labels: randomPickMultiple(ISSUE_LABELS, randomBetween(1, 3)),
      assignees: state === 'closed' || Math.random() > 0.5
        ? [randomPick(MOCK_TEAM_MEMBERS).name]
        : undefined,
      comments: randomBetween(0, 10),
      createdAt,
      fetchedAt: new Date().toISOString(),
    }

    if (state === 'closed') {
      issue.closedAt = daysAgo(Math.max(0, daysAgoValue - randomBetween(1, 10)))
    }

    issues.push(issue)
  }

  return issues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Generate a random commit SHA.
 */
function generateCommitSha(): string {
  return Array.from({ length: 40 }, () =>
    '0123456789abcdef'[Math.floor(Math.random() * 16)]
  ).join('')
}

/**
 * Generate a weighted PR state.
 */
function generatePRState(): GitHubPullRequest['state'] {
  const rand = Math.random()
  if (rand < 0.60) return 'merged'
  if (rand < 0.85) return 'open'
  return 'closed'
}
