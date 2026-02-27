'use client'

/**
 * InvestorPipeline Component
 *
 * A Kanban-style board showing investors organized by their pipeline stage.
 * Each column represents a stage in the fundraising journey.
 *
 * WHAT IS A KANBAN BOARD?
 * - Visual project management tool (originated at Toyota)
 * - Work items (cards) move through columns (stages)
 * - Great for tracking progress through a workflow
 * - Example: Trello, Jira boards
 *
 * IN FUNDRAISING CONTEXT:
 * - Columns are pipeline stages: Lead → Contacted → Meeting → Discussion → Closed
 * - Cards are investors
 * - Drag cards to move investors through your pipeline
 *
 * COMPONENT STRUCTURE:
 * - InvestorPipeline (this file): Main container, fetches data
 * - PipelineColumn: Single column showing investors in one stage
 * - InvestorCard: Individual investor card (already created)
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, RefreshCw } from 'lucide-react'
import { getInvestors, moveInvestorToStage } from '@/lib/actions/investors'
import { InvestorCard } from './InvestorCard'
import { InvestorModal } from './InvestorModal'
import type { Investor, InvestorStage, InvestorsByStage } from '@/types/investors'
import {
  INVESTOR_STAGES,
  INVESTOR_STAGE_LABELS,
  INVESTOR_STAGE_COLORS,
  groupInvestorsByStage,
} from '@/types/investors'

// ========================================
// PIPELINE COLUMN COMPONENT
// ========================================

/**
 * Props for the PipelineColumn component.
 */
interface PipelineColumnProps {
  /** The stage this column represents */
  stage: InvestorStage
  /** Investors in this stage */
  investors: Investor[]
  /** Callback when an investor is dropped into this column */
  onDrop: (investorId: string, newStage: InvestorStage) => void
  /** Callback when an investor card is clicked */
  onInvestorClick: (investor: Investor) => void
}

/**
 * PipelineColumn - A single column in the Kanban board.
 *
 * DRAG AND DROP:
 * - Uses HTML5 drag and drop API
 * - onDragOver: Allows dropping here
 * - onDrop: Handles when something is dropped
 */
function PipelineColumn({
  stage,
  investors,
  onDrop,
  onInvestorClick,
}: PipelineColumnProps) {
  /**
   * Track if something is being dragged over this column.
   * Used to show visual feedback (highlight the column).
   */
  const [isDragOver, setIsDragOver] = useState(false)

  /**
   * Handle drag over event.
   * We need to call preventDefault() to allow dropping.
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault() // Required to allow drop
    setIsDragOver(true)
  }

  /**
   * Handle drag leave - remove highlight when drag leaves column.
   */
  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  /**
   * Handle drop - extract investor ID and call onDrop.
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    // Get the investor ID from the drag data
    const investorId = e.dataTransfer.getData('text/plain')
    if (investorId) {
      onDrop(investorId, stage)
    }
  }

  /**
   * Make an investor card draggable.
   * Sets the investor ID as drag data.
   */
  const handleDragStart = (e: React.DragEvent, investorId: string) => {
    e.dataTransfer.setData('text/plain', investorId)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      className={`flex flex-col min-w-[280px] max-w-[280px] rounded-lg bg-muted/50 ${
        isDragOver ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          {/* Stage Label with Color Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${INVESTOR_STAGE_COLORS[stage]}`}
            >
              {INVESTOR_STAGE_LABELS[stage]}
            </span>
          </div>
          {/* Count Badge */}
          <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
            {investors.length}
          </span>
        </div>
      </div>

      {/* Column Content - List of Investor Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-250px)]">
        {investors.length === 0 ? (
          // Empty state
          <div className="text-center text-sm text-muted-foreground py-8">
            No investors in this stage
          </div>
        ) : (
          // Map through investors and render cards
          investors.map((investor) => (
            <div
              key={investor.id}
              draggable
              onDragStart={(e) => handleDragStart(e, investor.id)}
              className="cursor-grab active:cursor-grabbing"
            >
              <InvestorCard
                investor={investor}
                onClick={() => onInvestorClick(investor)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ========================================
// MAIN COMPONENT
// ========================================

export function InvestorPipeline() {
  /**
   * State for investors grouped by stage.
   * This is what we display in the columns.
   */
  const [investorsByStage, setInvestorsByStage] = useState<InvestorsByStage | null>(
    null
  )

  /**
   * Loading state for initial data fetch.
   */
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Error state for displaying error messages.
   */
  const [error, setError] = useState<string | null>(null)

  /**
   * Modal state - controls the add/edit investor modal.
   */
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | undefined>(
    undefined
  )

  /**
   * Fetch investors from the server.
   *
   * useCallback memoizes this function so it doesn't change on every render.
   * This is important for useEffect dependencies.
   */
  const fetchInvestors = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getInvestors()

      if (result.success) {
        // Group investors by their pipeline stage
        const grouped = groupInvestorsByStage(result.data)
        setInvestorsByStage(grouped)
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      console.error('Failed to fetch investors:', err)
      setError('Failed to load investors. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Fetch investors on component mount.
   *
   * useEffect with [] dependency array runs once on mount.
   */
  useEffect(() => {
    fetchInvestors()
  }, [fetchInvestors])

  /**
   * Handle dropping an investor into a new stage.
   *
   * This updates the database and then updates local state
   * for immediate visual feedback.
   */
  const handleDrop = async (investorId: string, newStage: InvestorStage) => {
    if (!investorsByStage) return

    // Find the investor in our current state
    let movedInvestor: Investor | null = null
    let oldStage: InvestorStage | null = null

    for (const stage of INVESTOR_STAGES) {
      const found = investorsByStage[stage].find((i) => i.id === investorId)
      if (found) {
        movedInvestor = found
        oldStage = stage
        break
      }
    }

    // Don't do anything if dropped in same column
    if (!movedInvestor || oldStage === newStage) return

    // Optimistic update: Update UI immediately
    const newInvestorsByStage = { ...investorsByStage }

    // Remove from old stage
    newInvestorsByStage[oldStage!] = newInvestorsByStage[oldStage!].filter(
      (i) => i.id !== investorId
    )

    // Add to new stage (at the beginning)
    newInvestorsByStage[newStage] = [
      { ...movedInvestor, stage: newStage },
      ...newInvestorsByStage[newStage],
    ]

    setInvestorsByStage(newInvestorsByStage)

    // Update the database
    try {
      const result = await moveInvestorToStage(investorId, newStage)

      if (!result.success) {
        // Revert on failure
        console.error('Failed to move investor:', result.error)
        fetchInvestors() // Refresh to get correct state
      }
    } catch (err) {
      console.error('Failed to move investor:', err)
      fetchInvestors() // Refresh to get correct state
    }
  }

  /**
   * Handle clicking an investor card.
   * Opens the modal in edit mode.
   */
  const handleInvestorClick = (investor: Investor) => {
    setSelectedInvestor(investor)
    setIsModalOpen(true)
  }

  /**
   * Handle opening the modal for a new investor.
   */
  const handleAddNew = () => {
    setSelectedInvestor(undefined)
    setIsModalOpen(true)
  }

  /**
   * Handle successful create/update.
   * Refresh the list to show changes.
   */
  const handleModalSuccess = () => {
    fetchInvestors()
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Investor Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Drag investors between stages to track your progress
          </p>
        </div>
        <div className="flex gap-2">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInvestors}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {/* Add Investor Button */}
          <Button size="sm" onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-1" />
            Add Investor
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
      {isLoading && !investorsByStage && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {INVESTOR_STAGES.slice(0, 6).map((stage) => (
            <div
              key={stage}
              className="min-w-[280px] max-w-[280px] h-[400px] rounded-lg bg-muted/50"
            >
              <div className="p-3 border-b">
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="p-2 space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pipeline Board */}
      {investorsByStage && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {/*
            Map through all stages to create columns.
            We show all stages even if empty.
          */}
          {INVESTOR_STAGES.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              investors={investorsByStage[stage]}
              onDrop={handleDrop}
              onInvestorClick={handleInvestorClick}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Investor Modal */}
      <InvestorModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        investor={selectedInvestor}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
