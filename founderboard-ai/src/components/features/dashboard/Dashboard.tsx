'use client'

import { useState, useEffect, useCallback } from 'react'
import { KPICard } from './KPICard'
import { EditMetricModal } from './EditMetricModal'
import { MRRChart } from './MRRChart'
import { getMetrics } from '@/lib/actions/metrics'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metric, MetricType } from '@/types/metrics'
import type { Role } from '@/types/organization'

interface DashboardProps {
  role: Role
}

const METRIC_TYPES: MetricType[] = ['mrr', 'users', 'churn', 'conversions']

export function Dashboard({ role }: DashboardProps) {
  const [metrics, setMetrics] = useState<Map<MetricType, Metric>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [editingMetric, setEditingMetric] = useState<MetricType | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      const result = await getMetrics()
      if (result.success) {
        const metricsMap = new Map<MetricType, Metric>()
        result.data.forEach((metric) => {
          metricsMap.set(metric.type, metric)
        })
        setMetrics(metricsMap)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const handleEditClick = (type: MetricType) => {
    setEditingMetric(type)
  }

  const handleModalClose = () => {
    setEditingMetric(null)
  }

  const handleMetricUpdated = () => {
    fetchMetrics()
  }

  const currentEditValue = editingMetric ? metrics.get(editingMetric)?.value ?? null : null

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {METRIC_TYPES.map((type) => (
            <Skeleton key={type} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {METRIC_TYPES.map((type) => {
          const metric = metrics.get(type)
          return (
            <KPICard
              key={type}
              type={type}
              value={metric?.value ?? null}
              previousValue={metric?.previousValue ?? null}
              role={role}
              onEdit={handleEditClick}
            />
          )
        })}
      </div>

      {/* MRR Chart */}
      <MRRChart />

      {/* Edit Modal */}
      <EditMetricModal
        type={editingMetric}
        currentValue={currentEditValue}
        isOpen={editingMetric !== null}
        onClose={handleModalClose}
        onSuccess={handleMetricUpdated}
      />
    </div>
  )
}
