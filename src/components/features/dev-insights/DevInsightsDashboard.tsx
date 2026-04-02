'use client'

/**
 * DevInsightsDashboard Component
 *
 * Main dashboard showing GitHub and Linear data.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { DevMetrics } from './DevMetrics'
import { CommitsList } from './CommitsList'
import { PullRequestsList } from './PullRequestsList'
import { LinearIssuesList } from './LinearIssuesList'
import {
  getIntegrations,
  getGitHubCommits,
  getGitHubPullRequests,
  getLinearIssues,
  syncIntegration,
} from '@/lib/actions/integrations'
import type {
  Integration,
  GitHubCommit,
  GitHubPullRequest,
  LinearIssue,
} from '@/types/integrations'
import Link from 'next/link'

type TabType = 'overview' | 'commits' | 'prs' | 'linear'

export function DevInsightsDashboard() {
  // State
  const [githubIntegration, setGithubIntegration] = useState<Integration | null>(null)
  const [linearIntegration, setLinearIntegration] = useState<Integration | null>(null)
  const [commits, setCommits] = useState<GitHubCommit[]>([])
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([])
  const [linearIssues, setLinearIssues] = useState<LinearIssue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Fetch data on mount
  useEffect(() => {
    loadData()
  }, [])

  /**
   * Load GitHub and Linear integration data.
   */
  async function loadData() {
    setIsLoading(true)
    setError(null)

    try {
      // Get all integrations
      const intResult = await getIntegrations()
      if (!intResult.success) {
        setError(intResult.error.message)
        return
      }

      // Find GitHub and Linear integrations
      const github = intResult.data.find((i) => i.type === 'github')
      const linear = intResult.data.find((i) => i.type === 'linear')

      setGithubIntegration(github || null)
      setLinearIntegration(linear || null)

      // Fetch GitHub data
      if (github && github.status === 'active') {
        const [commitsResult, prsResult] = await Promise.all([
          getGitHubCommits(github.id, 50),
          getGitHubPullRequests(github.id, 50),
        ])

        if (commitsResult.success) setCommits(commitsResult.data)
        if (prsResult.success) setPullRequests(prsResult.data)
      }

      // Fetch Linear data
      if (linear && linear.status === 'active') {
        const issuesResult = await getLinearIssues(linear.id, 100)
        if (issuesResult.success) setLinearIssues(issuesResult.data)
      }
    } catch (err) {
      console.error('Error loading dev insights:', err)
      setError('Failed to load development data.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Trigger sync for integrations.
   */
  async function handleSync() {
    setIsSyncing(true)

    try {
      const promises: Promise<unknown>[] = []
      if (githubIntegration) promises.push(syncIntegration(githubIntegration.id))
      if (linearIntegration) promises.push(syncIntegration(linearIntegration.id))

      await Promise.all(promises)
      await loadData()
    } catch (err) {
      console.error('Error syncing:', err)
      setError('Failed to sync data.')
    } finally {
      setIsSyncing(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  // No integrations connected
  if (!githubIntegration && !linearIntegration) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="text-5xl">{"</>"}</div>
            <h3 className="text-lg font-semibold">Connect Development Tools</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Connect GitHub and Linear to track commits, pull requests, and issues.
            </p>
            <Button asChild>
              <Link href="/integrations">Connect Integrations</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'commits' as const, label: 'Commits', count: commits.length, disabled: !githubIntegration },
    { id: 'prs' as const, label: 'Pull Requests', count: pullRequests.length, disabled: !githubIntegration },
    { id: 'linear' as const, label: 'Linear Issues', count: linearIssues.length, disabled: !linearIntegration },
  ]

  return (
    <div className="space-y-6">
      {/* Header with integration status and sync button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {githubIntegration && (
            <div className="flex items-center gap-2">
              <span className="text-xl">{"</>"}</span>
              <span className="font-medium">{githubIntegration.name}</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  githubIntegration.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}
              >
                {githubIntegration.status}
              </span>
            </div>
          )}
          {linearIntegration && (
            <div className="flex items-center gap-2">
              <span className="text-xl">{"[]"}</span>
              <span className="font-medium">{linearIntegration.name}</span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  linearIntegration.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}
              >
                {linearIntegration.status}
              </span>
            </div>
          )}
        </div>

        <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? (
            <>
              <Spinner className="h-4 w-4 mr-2" />
              Syncing...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Sync Now
            </>
          )}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : tab.disabled
                  ? 'border-transparent text-muted-foreground/50 cursor-not-allowed'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics */}
          <DevMetrics
            commits={commits}
            pullRequests={pullRequests}
            linearIssues={linearIssues}
          />

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {githubIntegration && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Commits</h3>
                  <CommitsList commits={commits.slice(0, 5)} compact />
                  {commits.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => setActiveTab('commits')}
                    >
                      View All Commits
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {linearIntegration && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">In Progress</h3>
                  <LinearIssuesList
                    issues={linearIssues.filter((i) => i.state === 'in_progress').slice(0, 5)}
                    compact
                  />
                  {linearIssues.filter((i) => i.state === 'in_progress').length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => setActiveTab('linear')}
                    >
                      View All Issues
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === 'commits' && (
        <Card>
          <CardContent className="pt-6">
            <CommitsList commits={commits} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'prs' && (
        <Card>
          <CardContent className="pt-6">
            <PullRequestsList pullRequests={pullRequests} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'linear' && (
        <Card>
          <CardContent className="pt-6">
            <LinearIssuesList issues={linearIssues} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
