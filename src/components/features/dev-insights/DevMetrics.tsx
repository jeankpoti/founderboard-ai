'use client'

/**
 * DevMetrics Component
 *
 * Displays KPI cards for development metrics.
 */

import { Card, CardContent } from '@/components/ui/card'
import type {
  GitHubCommit,
  GitHubPullRequest,
  LinearIssue,
} from '@/types/integrations'
import {
  getTotalCommits,
  getTotalLinesChanged,
  getPRMergeRate,
  getLinearIssuesByState,
  calculateVelocity,
  getTopContributors,
} from '@/types/integrations'

interface DevMetricsProps {
  commits: GitHubCommit[]
  pullRequests: GitHubPullRequest[]
  linearIssues: LinearIssue[]
}

export function DevMetrics({ commits, pullRequests, linearIssues }: DevMetricsProps) {
  // Calculate metrics
  const totalCommits = getTotalCommits(commits)
  const linesChanged = getTotalLinesChanged(commits)
  const mergeRate = getPRMergeRate(pullRequests)
  const issuesByState = getLinearIssuesByState(linearIssues)
  const velocity = calculateVelocity(linearIssues)
  const topContributors = getTopContributors(commits, 3)

  const openPRs = pullRequests.filter((pr) => pr.state === 'open').length
  const mergedPRs = pullRequests.filter((pr) => pr.state === 'merged').length

  const kpiCards = [
    {
      title: 'Commits',
      value: totalCommits.toLocaleString(),
      subtitle: `${linesChanged.toLocaleString()} lines changed`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
    },
    {
      title: 'Pull Requests',
      value: pullRequests.length.toString(),
      extra: (
        <div className="flex gap-2 text-xs mt-1">
          <span className="text-green-600">{openPRs} open</span>
          <span className="text-purple-600">{mergedPRs} merged</span>
        </div>
      ),
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
          />
        </svg>
      ),
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
    },
    {
      title: 'Merge Rate',
      value: mergeRate !== null ? `${mergeRate}%` : '—',
      subtitle: mergeRate !== null ? (mergeRate >= 80 ? 'Excellent' : mergeRate >= 60 ? 'Good' : 'Needs attention') : 'No data',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: mergeRate !== null && mergeRate >= 80
        ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
        : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
    },
    {
      title: 'Velocity',
      value: velocity !== null ? velocity.toString() : '—',
      subtitle: velocity !== null ? 'points/week' : 'No data',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400',
    },
  ]

  const hasNoData = commits.length === 0 && pullRequests.length === 0 && linearIssues.length === 0

  if (hasNoData) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1 text-muted-foreground/50">—</p>
                  <p className="text-xs text-muted-foreground mt-1">No data yet</p>
                </div>
                <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                  )}
                  {card.extra && card.extra}
                </div>
                <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Linear Issue Breakdown */}
        {linearIssues.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-medium mb-3">Issue Status</h4>
              <div className="space-y-2">
                {Object.entries(issuesByState)
                  .filter(([_, count]) => count > 0)
                  .map(([state, count]) => {
                    const total = linearIssues.length
                    const percentage = Math.round((count / total) * 100)
                    const colors: Record<string, string> = {
                      backlog: 'bg-slate-400',
                      todo: 'bg-blue-400',
                      in_progress: 'bg-yellow-400',
                      done: 'bg-green-400',
                      canceled: 'bg-red-400',
                    }
                    const labels: Record<string, string> = {
                      backlog: 'Backlog',
                      todo: 'To Do',
                      in_progress: 'In Progress',
                      done: 'Done',
                      canceled: 'Canceled',
                    }

                    return (
                      <div key={state} className="flex items-center gap-2">
                        <div className="w-24 text-sm text-muted-foreground">
                          {labels[state]}
                        </div>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[state]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-12 text-sm text-right">{count}</div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Contributors */}
        {topContributors.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-medium mb-3">Top Contributors</h4>
              <div className="space-y-3">
                {topContributors.map((contributor, index) => (
                  <div key={contributor.name} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </div>
                    {contributor.avatar ? (
                      <img
                        src={contributor.avatar}
                        alt={contributor.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {contributor.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{contributor.name}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {contributor.commits} commits
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
