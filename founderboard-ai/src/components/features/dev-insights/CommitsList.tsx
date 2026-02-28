'use client'

/**
 * CommitsList Component
 *
 * Displays a list of GitHub commits.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { GitHubCommit } from '@/types/integrations'

interface CommitsListProps {
  commits: GitHubCommit[]
  compact?: boolean
}

export function CommitsList({ commits, compact = false }: CommitsListProps) {
  const [showCount, setShowCount] = useState(compact ? commits.length : 20)

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

  // Truncate commit message to first line
  function truncateMessage(message: string, maxLength = 80): string {
    const firstLine = message.split('\n')[0]
    if (firstLine.length <= maxLength) return firstLine
    return firstLine.slice(0, maxLength) + '...'
  }

  // No commits
  if (commits.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">{"</>"}</div>
        <p className="text-muted-foreground">No commits yet</p>
        <p className="text-sm text-muted-foreground">
          Commits will appear here once synced from GitHub.
        </p>
      </div>
    )
  }

  const visibleCommits = commits.slice(0, showCount)

  return (
    <div className="space-y-2">
      {visibleCommits.map((commit) => (
        <div
          key={commit.id}
          className={`flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors ${
            compact ? 'p-2' : ''
          }`}
        >
          {/* Avatar */}
          {!compact && (
            <div className="flex-shrink-0">
              {commit.authorAvatar ? (
                <img
                  src={commit.authorAvatar}
                  alt={commit.authorName}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {commit.authorName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`font-medium ${compact ? 'text-sm' : ''} truncate`}>
              {truncateMessage(commit.message, compact ? 60 : 80)}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>{commit.authorName}</span>
              <span>in</span>
              <span className="font-mono bg-muted px-1 rounded">
                {commit.repository.split('/')[1] || commit.repository}
              </span>
              {commit.branch && (
                <>
                  <span>/</span>
                  <span className="font-mono">{commit.branch}</span>
                </>
              )}
            </div>
          </div>

          {/* Stats and Time */}
          <div className="flex-shrink-0 text-right">
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(commit.committedAt)}
            </span>
            {!compact && commit.additions !== undefined && commit.deletions !== undefined && (
              <div className="flex items-center gap-1 text-xs mt-1 justify-end">
                <span className="text-green-600">+{commit.additions}</span>
                <span className="text-red-600">-{commit.deletions}</span>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Load more */}
      {!compact && commits.length > showCount && (
        <div className="text-center pt-2">
          <Button variant="outline" onClick={() => setShowCount(showCount + 20)}>
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
