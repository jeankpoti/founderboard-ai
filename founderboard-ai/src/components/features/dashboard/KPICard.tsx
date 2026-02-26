'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  METRIC_CONFIG,
  formatMetricValue,
  calculateTrend,
  type MetricType,
  type TrendDirection,
} from '@/types/metrics'
import type { Role } from '@/types/organization'

interface KPICardProps {
  type: MetricType
  value: number | null
  previousValue: number | null
  role: Role
  onEdit: (type: MetricType) => void
}

function TrendIndicator({ direction, changePercent }: { direction: TrendDirection; changePercent: number | null }) {
  if (direction === 'stable' || changePercent === null) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
        Stable
      </span>
    )
  }

  const isUp = direction === 'up'
  const colorClass = isUp ? 'text-green-600' : 'text-red-600'

  return (
    <span className={`text-xs flex items-center gap-1 ${colorClass}`}>
      {isUp ? (
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      ) : (
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      )}
      {Math.abs(changePercent).toFixed(1)}%
    </span>
  )
}

export function KPICard({ type, value, previousValue, role, onEdit }: KPICardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const config = METRIC_CONFIG[type]
  const { direction, changePercent } = calculateTrend(value, previousValue)
  const canEdit = role !== 'viewer'

  // Check if value is concerning based on thresholds
  const isConcerning = config.goodThreshold && value !== null && (
    (config.goodThreshold.max !== undefined && value > config.goodThreshold.max) ||
    (config.goodThreshold.min !== undefined && value < config.goodThreshold.min)
  )

  return (
    <Card
      className={`relative transition-shadow hover:shadow-md ${isConcerning ? 'border-yellow-400' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <p className="text-sm font-medium text-muted-foreground">{config.label}</p>
        {canEdit && isHovered && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onEdit(type)}
          >
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {value !== null ? (
          <>
            <p className="text-2xl font-bold">{formatMetricValue(value, config.format)}</p>
            <div className="flex items-center gap-2 mt-1">
              <TrendIndicator direction={direction} changePercent={changePercent} />
              {isConcerning && (
                <span className="text-xs text-yellow-600">Needs attention</span>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-lg text-muted-foreground">No data</p>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(type)}
              >
                Add {config.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Tooltip on hover */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-popover border rounded-md shadow-lg z-10">
          <p className="text-sm">{config.description}</p>
          {config.goodThreshold && (
            <p className="text-xs text-muted-foreground mt-1">
              {config.goodThreshold.max !== undefined && `Target: below ${config.goodThreshold.max}%`}
              {config.goodThreshold.min !== undefined && `Target: above ${config.goodThreshold.min}%`}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
