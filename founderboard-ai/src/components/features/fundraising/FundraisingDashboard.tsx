'use client'

/**
 * FundraisingDashboard Component
 *
 * The main dashboard for tracking your fundraising progress.
 * Shows active rounds, term sheets, and key metrics.
 *
 * WHAT THIS SHOWS:
 * - Current round progress (how much raised vs target)
 * - List of fundraising rounds
 * - Recent term sheets
 * - Quick stats (total raised, number of meetings, etc.)
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, DollarSign, FileText, TrendingUp, RefreshCw } from 'lucide-react'
import { getRounds, getAllTermSheets } from '@/lib/actions/fundraising'
import { RoundModal } from './RoundModal'
import type { FundraisingRound, TermSheet } from '@/types/fundraising'
import {
  ROUND_TYPE_LABELS,
  ROUND_STATUS_LABELS,
  ROUND_STATUS_COLORS,
  TERM_SHEET_STATUS_LABELS,
  TERM_SHEET_STATUS_COLORS,
  formatCurrency,
  calculateRoundProgress,
} from '@/types/fundraising'

// ========================================
// HELPER COMPONENTS
// ========================================

/**
 * Progress bar showing how much has been raised.
 */
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div
        className="bg-primary h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  )
}

/**
 * Stat card for displaying key metrics.
 */
function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string
  value: string
  icon: React.ElementType
  description?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Card displaying a fundraising round.
 */
function RoundCard({ round }: { round: FundraisingRound }) {
  const progress = calculateRoundProgress(round.raisedAmount, round.targetAmount)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold">{round.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{ROUND_TYPE_LABELS[round.type]}</Badge>
              <Badge className={ROUND_STATUS_COLORS[round.status]}>
                {ROUND_STATUS_LABELS[round.status]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <ProgressBar progress={progress} />
          <div className="flex justify-between text-sm">
            <span>{formatCurrency(round.raisedAmount, round.currency)}</span>
            <span className="text-muted-foreground">
              of {formatCurrency(round.targetAmount, round.currency)}
            </span>
          </div>
        </div>

        {round.preMoneyValuation && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">Pre-money Valuation</p>
            <p className="font-medium">
              {formatCurrency(round.preMoneyValuation, round.currency)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Row displaying a term sheet.
 */
function TermSheetRow({ termSheet }: { termSheet: TermSheet }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div>
        <p className="font-medium">{termSheet.investorName}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(termSheet.amount, termSheet.currency)} at{' '}
          {formatCurrency(termSheet.preMoneyValuation, termSheet.currency)} pre
        </p>
      </div>
      <Badge className={TERM_SHEET_STATUS_COLORS[termSheet.status]}>
        {TERM_SHEET_STATUS_LABELS[termSheet.status]}
      </Badge>
    </div>
  )
}

// ========================================
// MAIN COMPONENT
// ========================================

export function FundraisingDashboard() {
  // State for data
  const [rounds, setRounds] = useState<FundraisingRound[]>([])
  const [termSheets, setTermSheets] = useState<TermSheet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for modals
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false)

  /**
   * Fetch all data.
   */
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch rounds and term sheets in parallel
      const [roundsResult, termSheetsResult] = await Promise.all([
        getRounds(),
        getAllTermSheets(),
      ])

      if (roundsResult.success) {
        setRounds(roundsResult.data)
      }
      if (termSheetsResult.success) {
        setTermSheets(termSheetsResult.data)
      }
    } catch (err) {
      console.error('Failed to fetch fundraising data:', err)
      setError('Failed to load data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [fetchData])

  /**
   * Handle successful round creation.
   */
  const handleRoundSuccess = () => {
    fetchData()
  }

  // Calculate summary stats
  const activeRound = rounds.find((r) => r.status === 'active')
  const totalRaised = rounds
    .filter((r) => r.status === 'closed')
    .reduce((sum, r) => sum + r.raisedAmount, 0)
  const pendingTermSheets = termSheets.filter(
    (ts) => ts.status === 'received' || ts.status === 'reviewing'
  ).length

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Fundraising Overview</h2>
          <p className="text-sm text-muted-foreground">
            Track your fundraising rounds and investor commitments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsRoundModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Round
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {/* Stats Cards */}
      {!isLoading && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Raised"
            value={formatCurrency(totalRaised)}
            icon={DollarSign}
            description="From closed rounds"
          />
          <StatCard
            title="Active Round"
            value={activeRound ? activeRound.name : 'None'}
            icon={TrendingUp}
            description={
              activeRound
                ? `${calculateRoundProgress(activeRound.raisedAmount, activeRound.targetAmount)}% complete`
                : 'No active round'
            }
          />
          <StatCard
            title="Pending Term Sheets"
            value={pendingTermSheets.toString()}
            icon={FileText}
            description="Awaiting decision"
          />
        </div>
      )}

      {/* Content Grid */}
      {!isLoading && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Rounds Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fundraising Rounds</CardTitle>
            </CardHeader>
            <CardContent>
              {rounds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No fundraising rounds yet</p>
                  <p className="text-sm mt-1">
                    Create your first round to start tracking
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsRoundModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Round
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rounds.map((round) => (
                    <RoundCard key={round.id} round={round} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Term Sheets Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Term Sheets</CardTitle>
            </CardHeader>
            <CardContent>
              {termSheets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No term sheets yet</p>
                  <p className="text-sm mt-1">
                    Term sheets will appear here when you receive them
                  </p>
                </div>
              ) : (
                <div>
                  {termSheets.slice(0, 5).map((termSheet) => (
                    <TermSheetRow key={termSheet.id} termSheet={termSheet} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Round Modal */}
      <RoundModal
        open={isRoundModalOpen}
        onOpenChange={setIsRoundModalOpen}
        onSuccess={handleRoundSuccess}
      />
    </div>
  )
}
