'use client'

/**
 * PullRequestsList Component
 *
 * Displays a list of GitHub pull requests.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { GitHubPullRequest } from '@/types/integrations'
import {
  GITHUB_PR_STATE_LABELS,
  GITHUB_PR_STATE_COLORS,
} from '@/types/integrations'

interface PullRequestsListProps {
  pullRequests: GitHubPullRequest[]
}

export function PullRequestsList({ pullRequests }: PullRequestsListProps) {
  const [filter, setFilter] = useState<GitHubPullRequest['state'] | 'all'>('all')
  const [showCount, setShowCount] = useState(20)

  // Filter PRs
  const filteredPRs = filter === 'all'
    ? pullRequests
    : pullRequests.filter((pr) => pr.state === filter)

  // Paginate
  const visiblePRs = filteredPRs.slice(0, showCount)

  // Format relative time
  function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // State icon
  function StateIcon({ state }: { state: GitHubPullRequest['state'] }) {
    switch (state) {
      case 'open':
        return (
          <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        )
      case 'merged':
        return (
          <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        )
      case 'closed':
        return (
          <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
    }
  }

  // No PRs
  if (pullRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">{"<>"}</div>
        <p className="text-muted-foreground">No pull requests yet</p>
        <p className="text-sm text-muted-foreground">
          Pull requests will appear here once synced from GitHub.
        </p>
      </div>
    )
  }

  // Get counts for filter buttons
  const stateCounts = {
    all: pullRequests.length,
    open: pullRequests.filter((pr) => pr.state === 'open').length,
    merged: pullRequests.filter((pr) => pr.state === 'merged').length,
    closed: pullRequests.filter((pr) => pr.state === 'closed').length,
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({stateCounts.all})
        </Button>
        {(['open', 'merged', 'closed'] as const).map((state) => {
          if (stateCounts[state] === 0) return null
          return (
            <Button
              key={state}
              variant={filter === state ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(state)}
            >
              {GITHUB_PR_STATE_LABELS[state]} ({stateCounts[state]})
            </Button>
          )
        })}
      </div>

      {/* PRs list */}
      <div className="space-y-2">
        {visiblePRs.map((pr) => (
          <div
            key={pr.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
          >
            {/* State icon */}
            <div className="flex-shrink-0 mt-0.5">
              <StateIcon state={pr.state} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-medium">{pr.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                <span>#{pr.externalId}</span>
                <span>by</span>
                <span className="font-medium">{pr.authorName}</span>
                <span>in</span>
                <span className="font-mono bg-muted px-1 rounded">
                  {pr.repository.split('/')[1] || pr.repository}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="font-mono">
                  {pr.headBranch} → {pr.baseBranch}
                </span>
                {pr.commits && <span>{pr.commits} commits</span>}
                {pr.comments !== undefined && pr.comments > 0 && (
                  <span>{pr.comments} comments</span>
                )}
              </div>
            </div>

            {/* Stats and Time */}
            <div className="flex-shrink-0 text-right">
              <span className={`text-xs px-2 py-1 rounded-full ${GITHUB_PR_STATE_COLORS[pr.state]}`}>
                {GITHUB_PR_STATE_LABELS[pr.state]}
              </span>
              <div className="text-xs text-muted-foreground mt-2">
                {formatRelativeTime(pr.mergedAt || pr.closedAt || pr.createdAt)}
              </div>
              {pr.additions !== undefined && pr.deletions !== undefined && (
                <div className="flex items-center gap-1 text-xs mt-1 justify-end">
                  <span className="text-green-600">+{pr.additions}</span>
                  <span className="text-red-600">-{pr.deletions}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {filteredPRs.length > showCount && (
        <div className="text-center pt-2">
          <Button variant="outline" onClick={() => setShowCount(showCount + 20)}>
            Load More
          </Button>
        </div>
      )}

      {/* No results after filter */}
      {filteredPRs.length === 0 && filter !== 'all' && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No {GITHUB_PR_STATE_LABELS[filter as GitHubPullRequest['state']].toLowerCase()} pull requests
          </p>
        </div>
      )}
    </div>
  )
}
