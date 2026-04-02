'use client'

/**
 * OKRDashboard Component
 *
 * The main dashboard for viewing and managing OKRs.
 * Shows objectives with their key results and progress.
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Target, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { getObjectives, getKeyResults } from '@/lib/actions/okrs'
import { ObjectiveModal } from './ObjectiveModal'
import { KeyResultModal } from './KeyResultModal'
import type { Objective, KeyResult } from '@/types/okrs'
import {
  OKR_PERIODS,
  OKR_PERIOD_LABELS,
  OKR_STATUS_LABELS,
  OKR_STATUS_COLORS,
  getProgressColor,
  getProgressBarColor,
  formatMetricValue,
  getCurrentQuarter,
  getCurrentYear,
} from '@/types/okrs'

// ========================================
// PROGRESS BAR COMPONENT
// ========================================

function ProgressBar({ progress, size = 'md' }: { progress: number; size?: 'sm' | 'md' }) {
  const height = size === 'sm' ? 'h-1.5' : 'h-2'

  return (
    <div className={`w-full bg-muted rounded-full ${height}`}>
      <div
        className={`${height} rounded-full transition-all duration-300 ${getProgressBarColor(progress)}`}
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  )
}

// ========================================
// KEY RESULT CARD
// ========================================

interface KeyResultCardProps {
  keyResult: KeyResult
  onEdit: () => void
}

function KeyResultCard({ keyResult, onEdit }: KeyResultCardProps) {
  return (
    <div
      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{keyResult.title}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span>
              {formatMetricValue(keyResult.currentValue, keyResult.metricType, keyResult.currency)}
            </span>
            <span>/</span>
            <span>
              {formatMetricValue(keyResult.targetValue, keyResult.metricType, keyResult.currency)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-sm font-bold ${getProgressColor(keyResult.progress)}`}>
            {keyResult.progress}%
          </span>
        </div>
      </div>
      <div className="mt-2">
        <ProgressBar progress={keyResult.progress} size="sm" />
      </div>
    </div>
  )
}

// ========================================
// OBJECTIVE CARD
// ========================================

interface ObjectiveCardProps {
  objective: Objective
  onEdit: () => void
  onAddKeyResult: () => void
}

function ObjectiveCard({ objective, onEdit, onAddKeyResult }: ObjectiveCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [keyResults, setKeyResults] = useState<KeyResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedKeyResult, setSelectedKeyResult] = useState<KeyResult | undefined>()
  const [isKeyResultModalOpen, setIsKeyResultModalOpen] = useState(false)

  // Fetch key results when expanded
  useEffect(() => {
    if (isExpanded) {
      setIsLoading(true)
      getKeyResults(objective.id)
        .then((result) => {
          if (result.success) {
            setKeyResults(result.data)
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [isExpanded, objective.id])

  const handleKeyResultEdit = (kr: KeyResult) => {
    setSelectedKeyResult(kr)
    setIsKeyResultModalOpen(true)
  }

  const handleKeyResultSuccess = () => {
    // Refresh key results
    getKeyResults(objective.id).then((result) => {
      if (result.success) {
        setKeyResults(result.data)
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <CardTitle
                className="text-base cursor-pointer hover:text-primary"
                onClick={onEdit}
              >
                {objective.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={OKR_STATUS_COLORS[objective.status]}>
                  {OKR_STATUS_LABELS[objective.status]}
                </Badge>
                {objective.ownerName && (
                  <span className="text-xs text-muted-foreground">
                    {objective.ownerName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xl font-bold ${getProgressColor(objective.progress)}`}>
              {objective.progress}%
            </span>
          </div>
        </div>
        <ProgressBar progress={objective.progress} />
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-2">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : keyResults.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">No key results yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={onAddKeyResult}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Key Result
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {keyResults.map((kr) => (
                <KeyResultCard
                  key={kr.id}
                  keyResult={kr}
                  onEdit={() => handleKeyResultEdit(kr)}
                />
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={onAddKeyResult}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Key Result
              </Button>
            </div>
          )}
        </CardContent>
      )}

      {/* Key Result Edit Modal */}
      <KeyResultModal
        open={isKeyResultModalOpen}
        onOpenChange={setIsKeyResultModalOpen}
        objectiveId={objective.id}
        keyResult={selectedKeyResult}
        onSuccess={handleKeyResultSuccess}
      />
    </Card>
  )
}

// ========================================
// MAIN COMPONENT
// ========================================

export function OKRDashboard() {
  // State
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentQuarter())
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentYear())

  // Modals
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false)
  const [selectedObjective, setSelectedObjective] = useState<Objective | undefined>()
  const [isKeyResultModalOpen, setIsKeyResultModalOpen] = useState(false)
  const [selectedObjectiveForKR, setSelectedObjectiveForKR] = useState<string | undefined>()

  // Fetch objectives
  const fetchObjectives = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getObjectives()
      if (result.success) {
        // Filter by period and year
        const filtered = result.data.filter(
          (obj) => obj.period === selectedPeriod && obj.year === selectedYear
        )
        setObjectives(filtered)
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      console.error('Failed to fetch objectives:', err)
      setError('Failed to load OKRs. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedPeriod, selectedYear])

  useEffect(() => {
    fetchObjectives()
  }, [fetchObjectives])

  // Handlers
  const handleAddObjective = () => {
    setSelectedObjective(undefined)
    setIsObjectiveModalOpen(true)
  }

  const handleEditObjective = (objective: Objective) => {
    setSelectedObjective(objective)
    setIsObjectiveModalOpen(true)
  }

  const handleAddKeyResult = (objectiveId: string) => {
    setSelectedObjectiveForKR(objectiveId)
    setIsKeyResultModalOpen(true)
  }

  const handleObjectiveSuccess = () => {
    fetchObjectives()
  }

  const handleKeyResultSuccess = () => {
    fetchObjectives()
  }

  // Calculate overall progress
  const overallProgress =
    objectives.length > 0
      ? Math.round(objectives.reduce((sum, obj) => sum + obj.progress, 0) / objectives.length)
      : 0

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Objectives & Key Results</h2>
          <p className="text-sm text-muted-foreground">
            Track progress toward your goals
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Period Filter */}
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OKR_PERIODS.map((period) => (
                <SelectItem key={period} value={period}>
                  {OKR_PERIOD_LABELS[period]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year Filter */}
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={fetchObjectives} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleAddObjective}>
            <Plus className="h-4 w-4 mr-1" />
            Add Objective
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Overall Progress Card */}
      {!isLoading && objectives.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {OKR_PERIOD_LABELS[selectedPeriod as keyof typeof OKR_PERIOD_LABELS]} {selectedYear}
                  </p>
                  <p className="text-lg font-semibold">Overall Progress</p>
                </div>
              </div>
              <span className={`text-3xl font-bold ${getProgressColor(overallProgress)}`}>
                {overallProgress}%
              </span>
            </div>
            <ProgressBar progress={overallProgress} />
            <p className="text-xs text-muted-foreground mt-2">
              Based on {objectives.length} objective{objectives.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && objectives.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Objectives Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first objective to start tracking progress.
              </p>
              <Button onClick={handleAddObjective}>
                <Plus className="h-4 w-4 mr-1" />
                Create Objective
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Objectives List */}
      {!isLoading && objectives.length > 0 && (
        <div className="space-y-4">
          {objectives.map((objective) => (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              onEdit={() => handleEditObjective(objective)}
              onAddKeyResult={() => handleAddKeyResult(objective.id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ObjectiveModal
        open={isObjectiveModalOpen}
        onOpenChange={setIsObjectiveModalOpen}
        objective={selectedObjective}
        defaultPeriod={selectedPeriod}
        defaultYear={selectedYear}
        onSuccess={handleObjectiveSuccess}
      />

      <KeyResultModal
        open={isKeyResultModalOpen}
        onOpenChange={setIsKeyResultModalOpen}
        objectiveId={selectedObjectiveForKR}
        onSuccess={handleKeyResultSuccess}
      />
    </div>
  )
}
