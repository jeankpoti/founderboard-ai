import { create } from 'zustand'

interface Metric {
  id: string
  orgId: string
  name: string
  type: 'mrr' | 'users' | 'churn' | 'conversions'
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  updatedAt: Date
}

interface MetricSnapshot {
  id: string
  metricId: string
  orgId: string
  value: number
  date: Date
}

interface MetricsState {
  metrics: Metric[]
  snapshots: MetricSnapshot[]
  isLoading: boolean
  error: string | null

  // Actions
  setMetrics: (metrics: Metric[]) => void
  updateMetric: (id: string, updates: Partial<Metric>) => void
  setSnapshots: (snapshots: MetricSnapshot[]) => void
  addSnapshot: (snapshot: MetricSnapshot) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  metrics: [],
  snapshots: [],
  isLoading: true,
  error: null,
}

export const useMetricsStore = create<MetricsState>((set) => ({
  ...initialState,

  setMetrics: (metrics) => set({ metrics }),
  updateMetric: (id, updates) =>
    set((state) => ({
      metrics: state.metrics.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  setSnapshots: (snapshots) => set({ snapshots }),
  addSnapshot: (snapshot) =>
    set((state) => ({ snapshots: [...state.snapshots, snapshot] })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))
