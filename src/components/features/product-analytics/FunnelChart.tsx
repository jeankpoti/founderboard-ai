'use client'

/**
 * FunnelChart Component
 *
 * Displays a conversion funnel visualization.
 */

import type { PostHogFunnel } from '@/types/integrations'

interface FunnelChartProps {
  funnel: PostHogFunnel
}

export function FunnelChart({ funnel }: FunnelChartProps) {
  if (!funnel.steps || funnel.steps.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No funnel steps defined</p>
      </div>
    )
  }

  const maxCount = funnel.steps[0]?.count || 1

  return (
    <div className="space-y-4">
      {/* Overall conversion */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Overall Conversion</span>
        <span className={`font-bold text-lg ${
          funnel.conversionRate >= 50 ? 'text-green-600' :
          funnel.conversionRate >= 25 ? 'text-amber-600' : 'text-red-600'
        }`}>
          {funnel.conversionRate}%
        </span>
      </div>

      {/* Funnel steps */}
      <div className="space-y-3">
        {funnel.steps.map((step, index) => {
          const width = maxCount > 0 ? (step.count / maxCount) * 100 : 0
          const isFirst = index === 0
          const isLast = index === funnel.steps.length - 1

          return (
            <div key={step.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{step.name}</span>
                <span className="text-muted-foreground">
                  {step.count.toLocaleString()}
                  {!isFirst && step.dropoff > 0 && (
                    <span className="text-red-500 ml-2">-{step.dropoff}%</span>
                  )}
                </span>
              </div>
              <div className="h-8 bg-muted rounded-lg overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isFirst ? 'bg-blue-500' :
                    isLast ? 'bg-green-500' :
                    'bg-blue-400'
                  }`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Arrow indicators between steps */}
      <div className="text-center text-xs text-muted-foreground pt-2">
        {funnel.steps.length} steps in funnel
      </div>
    </div>
  )
}
