'use client'

/**
 * RoadmapView Component
 *
 * Main component for displaying the product roadmap.
 * Features:
 * - Timeline view with quarters
 * - Milestone markers
 * - Status filtering
 * - Create/edit roadmap items
 *
 * WHAT IS A ROADMAP VIEW?
 * A visual timeline showing planned features and their progress.
 * Items are displayed as bars on a timeline, showing when work
 * starts and ends.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Flag,
  Calendar,
} from 'lucide-react'
import {
  getRoadmapItems,
  getMilestones,
  deleteRoadmapItem,
} from '@/lib/actions/roadmap'
import { RoadmapItemModal } from './RoadmapItemModal'
import { MilestoneModal } from './MilestoneModal'
import type { RoadmapItem, RoadmapMilestone, RoadmapItemStatus } from '@/types/roadmap'
import {
  ROADMAP_ITEM_STATUSES,
  ROADMAP_STATUS_LABELS,
  ROADMAP_STATUS_COLORS,
  ROADMAP_CATEGORY_ICONS,
  ROADMAP_CATEGORY_COLORS,
  getQuarter,
  calculateTimelinePosition,
} from '@/types/roadmap'

// ========================================
// TIMELINE ITEM COMPONENT
// ========================================

interface TimelineItemProps {
  item: RoadmapItem
  timelineStart: string
  timelineEnd: string
  onClick: () => void
}

function TimelineItem({ item, timelineStart, timelineEnd, onClick }: TimelineItemProps) {
  const { left, width } = calculateTimelinePosition(
    item.startDate,
    item.endDate,
    timelineStart,
    timelineEnd
  )

  return (
    <div
      className="absolute h-8 rounded-md cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all flex items-center px-2 text-xs text-white font-medium overflow-hidden"
      style={{
        left: `${left}%`,
        width: `${width}%`,
        minWidth: '100px',
      }}
      onClick={onClick}
    >
      <div className={`absolute inset-0 ${ROADMAP_CATEGORY_COLORS[item.category]}`} />
      <div
        className="absolute inset-y-0 left-0 bg-white/20"
        style={{ width: `${item.progress}%` }}
      />
      <span className="relative z-10 truncate">
        {ROADMAP_CATEGORY_ICONS[item.category]} {item.title}
      </span>
    </div>
  )
}

// ========================================
// MAIN COMPONENT
// ========================================

export function RoadmapView() {
  // State
  const [items, setItems] = useState<RoadmapItem[]>([])
  const [milestones, setMilestones] = useState<RoadmapMilestone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Timeline navigation (current quarter)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<RoadmapItem | undefined>()
  const [selectedMilestone, setSelectedMilestone] = useState<RoadmapMilestone | undefined>()

  // Calculate timeline range (show 6 months)
  const timelineStart = useMemo(() => {
    const start = new Date(currentDate)
    start.setMonth(start.getMonth() - 1)
    start.setDate(1)
    return start.toISOString().split('T')[0]
  }, [currentDate])

  const timelineEnd = useMemo(() => {
    const end = new Date(currentDate)
    end.setMonth(end.getMonth() + 5)
    end.setDate(0) // Last day of month
    return end.toISOString().split('T')[0]
  }, [currentDate])

  // Generate month headers
  const months = useMemo(() => {
    const result: { label: string; isCurrentMonth: boolean }[] = []
    const start = new Date(timelineStart)

    for (let i = 0; i < 6; i++) {
      const month = new Date(start)
      month.setMonth(month.getMonth() + i)
      const now = new Date()
      const isCurrentMonth =
        month.getMonth() === now.getMonth() &&
        month.getFullYear() === now.getFullYear()

      result.push({
        label: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        isCurrentMonth,
      })
    }

    return result
  }, [timelineStart])

  /**
   * Fetch roadmap data.
   */
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [itemsResult, milestonesResult] = await Promise.all([
        getRoadmapItems(),
        getMilestones(),
      ])

      if (itemsResult.success) {
        setItems(itemsResult.data)
      } else {
        setError(itemsResult.error.message)
      }

      if (milestonesResult.success) {
        setMilestones(milestonesResult.data)
      }
    } catch (err) {
      console.error('Failed to fetch roadmap data:', err)
      setError('Failed to load roadmap.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /**
   * Navigate timeline.
   */
  const navigateTimeline = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3))
      return newDate
    })
  }

  /**
   * Handle item click.
   */
  const handleItemClick = (item: RoadmapItem) => {
    setSelectedItem(item)
    setIsItemModalOpen(true)
  }

  /**
   * Handle create item.
   */
  const handleCreateItem = () => {
    setSelectedItem(undefined)
    setIsItemModalOpen(true)
  }

  /**
   * Handle create milestone.
   */
  const handleCreateMilestone = () => {
    setSelectedMilestone(undefined)
    setIsMilestoneModalOpen(true)
  }

  /**
   * Handle modal success.
   */
  const handleSuccess = () => {
    fetchData()
  }

  // Filter items
  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false
    }
    return true
  })

  // Group items by row (simple algorithm - could be improved)
  const rows = useMemo(() => {
    const result: RoadmapItem[][] = []
    filteredItems.forEach((item) => {
      // Find a row where this item doesn't overlap
      let placed = false
      for (const row of result) {
        const overlaps = row.some((existing) => {
          return !(
            new Date(item.endDate) < new Date(existing.startDate) ||
            new Date(item.startDate) > new Date(existing.endDate)
          )
        })
        if (!overlaps) {
          row.push(item)
          placed = true
          break
        }
      }
      if (!placed) {
        result.push([item])
      }
    })
    return result
  }, [filteredItems])

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Product Roadmap</h2>
          <p className="text-sm text-muted-foreground">
            Plan and track your product development
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleCreateMilestone}>
            <Flag className="h-4 w-4 mr-1" />
            Add Milestone
          </Button>
          <Button size="sm" onClick={handleCreateItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Filters & Navigation */}
      <div className="flex items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ROADMAP_ITEM_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {ROADMAP_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateTimeline('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-2">
            {getQuarter(currentDate.toISOString())}
          </span>
          <Button variant="outline" size="icon" onClick={() => navigateTimeline('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredItems.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Roadmap Items</h3>
              <p className="text-muted-foreground mb-4">
                Add your first roadmap item to start planning.
              </p>
              <Button onClick={handleCreateItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {!isLoading && filteredItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            {/* Month Headers */}
            <div className="flex border-b pb-2 mb-4">
              {months.map((month, i) => (
                <div
                  key={i}
                  className={`flex-1 text-center text-sm font-medium ${
                    month.isCurrentMonth ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {month.label}
                </div>
              ))}
            </div>

            {/* Timeline Rows */}
            <div className="space-y-3">
              {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="relative h-10">
                  {row.map((item) => (
                    <TimelineItem
                      key={item.id}
                      item={item}
                      timelineStart={timelineStart}
                      timelineEnd={timelineEnd}
                      onClick={() => handleItemClick(item)}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Milestones */}
            {milestones.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Milestones
                </h4>
                <div className="flex flex-wrap gap-2">
                  {milestones.map((milestone) => (
                    <Badge
                      key={milestone.id}
                      variant={milestone.isCompleted ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedMilestone(milestone)
                        setIsMilestoneModalOpen(true)
                      }}
                    >
                      {milestone.isCompleted ? '✓' : '○'} {milestone.name}
                      <span className="ml-1 text-xs opacity-70">
                        {new Date(milestone.targetDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      {!isLoading && filteredItems.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-muted-foreground">Status:</span>
          {ROADMAP_ITEM_STATUSES.map((status) => (
            <Badge key={status} variant="secondary" className={ROADMAP_STATUS_COLORS[status]}>
              {ROADMAP_STATUS_LABELS[status]}
            </Badge>
          ))}
        </div>
      )}

      {/* Modals */}
      <RoadmapItemModal
        open={isItemModalOpen}
        onOpenChange={setIsItemModalOpen}
        item={selectedItem}
        milestones={milestones}
        onSuccess={handleSuccess}
      />

      <MilestoneModal
        open={isMilestoneModalOpen}
        onOpenChange={setIsMilestoneModalOpen}
        milestone={selectedMilestone}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
