'use client'

/**
 * LinearIssuesList Component
 *
 * Displays a list of Linear issues.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { LinearIssue } from '@/types/integrations'
import {
  LINEAR_STATE_LABELS,
  LINEAR_STATE_COLORS,
} from '@/types/integrations'

interface LinearIssuesListProps {
  issues: LinearIssue[]
  compact?: boolean
}

export function LinearIssuesList({ issues, compact = false }: LinearIssuesListProps) {
  const [filter, setFilter] = useState<LinearIssue['state'] | 'all'>('all')
  const [showCount, setShowCount] = useState(compact ? issues.length : 20)

  // Filter issues
  const filteredIssues = filter === 'all'
    ? issues
    : issues.filter((issue) => issue.state === filter)

  // Paginate
  const visibleIssues = filteredIssues.slice(0, showCount)

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

  // Priority indicator
  function PriorityIndicator({ priority }: { priority?: number }) {
    if (priority === undefined || priority === 0) return null

    const colors = {
      1: 'bg-red-500', // Urgent
      2: 'bg-orange-500', // High
      3: 'bg-yellow-500', // Medium
      4: 'bg-blue-500', // Low
    }

    return (
      <div
        className={`w-2 h-2 rounded-full ${colors[priority as keyof typeof colors] || 'bg-slate-400'}`}
        title={`Priority ${priority}`}
      />
    )
  }

  // No issues
  if (issues.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">{"[]"}</div>
        <p className="text-muted-foreground">No issues yet</p>
        <p className="text-sm text-muted-foreground">
          Issues will appear here once synced from Linear.
        </p>
      </div>
    )
  }

  // Get counts for filter buttons
  const stateCounts = {
    all: issues.length,
    backlog: issues.filter((i) => i.state === 'backlog').length,
    todo: issues.filter((i) => i.state === 'todo').length,
    in_progress: issues.filter((i) => i.state === 'in_progress').length,
    done: issues.filter((i) => i.state === 'done').length,
    canceled: issues.filter((i) => i.state === 'canceled').length,
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      {!compact && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({stateCounts.all})
          </Button>
          {(['in_progress', 'todo', 'backlog', 'done', 'canceled'] as const).map((state) => {
            if (stateCounts[state] === 0) return null
            return (
              <Button
                key={state}
                variant={filter === state ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(state)}
              >
                {LINEAR_STATE_LABELS[state]} ({stateCounts[state]})
              </Button>
            )
          })}
        </div>
      )}

      {/* Issues list */}
      <div className="space-y-2">
        {visibleIssues.map((issue) => (
          <div
            key={issue.id}
            className={`flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors ${
              compact ? 'p-2' : ''
            }`}
          >
            {/* Priority indicator */}
            <div className="flex-shrink-0 mt-1.5">
              <PriorityIndicator priority={issue.priority} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {issue.identifier}
                </span>
                <p className={`font-medium truncate ${compact ? 'text-sm' : ''}`}>
                  {issue.title}
                </p>
              </div>
              {!compact && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                  <span className="bg-muted px-1.5 py-0.5 rounded">{issue.teamName}</span>
                  {issue.projectName && (
                    <span className="bg-muted px-1.5 py-0.5 rounded">{issue.projectName}</span>
                  )}
                  {issue.assigneeName && (
                    <span>
                      <span className="text-muted-foreground">Assigned to </span>
                      {issue.assigneeName}
                    </span>
                  )}
                  {issue.estimate !== undefined && (
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {issue.estimate} pts
                    </span>
                  )}
                </div>
              )}
              {!compact && issue.labels && issue.labels.length > 0 && (
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {issue.labels.slice(0, 3).map((label) => (
                    <span
                      key={label}
                      className="text-xs bg-muted px-1.5 py-0.5 rounded"
                    >
                      {label}
                    </span>
                  ))}
                  {issue.labels.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{issue.labels.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Status and Time */}
            <div className="flex-shrink-0 text-right">
              <span className={`text-xs px-2 py-1 rounded-full ${LINEAR_STATE_COLORS[issue.state]}`}>
                {LINEAR_STATE_LABELS[issue.state]}
              </span>
              {!compact && (
                <div className="text-xs text-muted-foreground mt-2">
                  {formatRelativeTime(issue.completedAt || issue.createdAt)}
                </div>
              )}
              {!compact && issue.dueDate && (
                <div className="text-xs text-muted-foreground mt-1">
                  Due: {new Date(issue.dueDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {!compact && filteredIssues.length > showCount && (
        <div className="text-center pt-2">
          <Button variant="outline" onClick={() => setShowCount(showCount + 20)}>
            Load More
          </Button>
        </div>
      )}

      {/* No results after filter */}
      {filteredIssues.length === 0 && filter !== 'all' && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No {LINEAR_STATE_LABELS[filter as LinearIssue['state']].toLowerCase()} issues
          </p>
        </div>
      )}
    </div>
  )
}
