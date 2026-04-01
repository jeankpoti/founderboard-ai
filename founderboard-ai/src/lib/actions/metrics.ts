'use server'

import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { getOrgContext } from '@/lib/auth/org-context'
import { updateMetricSchema, validateMetricValue } from '@/lib/validations/metrics'
import type { ApiResponse } from '@/types/api'
import type { Metric, MetricSnapshot, MetricType } from '@/types/metrics'

interface UpdateMetricResult {
  metric: Metric
}

export async function updateMetric(
  input: { type: MetricType; value: number }
): Promise<ApiResponse<UpdateMetricResult>> {
  try {
    // Verify user has access to current org
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated or no organization selected' },
      }
    }

    // Check permission (member or higher can edit metrics)
    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot edit metrics' },
      }
    }

    // Validate input
    const validation = updateMetricSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0]?.message || 'Invalid input',
        },
      }
    }

    const { type, value } = validation.data

    // Additional validation
    const valueError = validateMetricValue(type, value)
    if (valueError) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: valueError },
      }
    }

    const db = adminDb()
    const batch = db.batch()
    const now = new Date()
    const { organization, user } = orgContext

    // Get or create metric document
    const metricId = `${organization.id}_${type}`
    const metricRef = db.collection(COLLECTIONS.METRICS).doc(metricId)
    const existingMetric = await metricRef.get()

    const previousValue = existingMetric.exists
      ? (existingMetric.data() as Metric).value
      : null

    const metricData: Metric = {
      id: metricId,
      orgId: organization.id,
      type,
      value,
      previousValue,
      updatedAt: now.toISOString(),
      updatedBy: user.uid,
    }

    batch.set(metricRef, metricData)

    // Create snapshot for historical tracking
    const snapshotRef = db.collection(COLLECTIONS.METRIC_SNAPSHOTS).doc()
    const snapshotData: MetricSnapshot = {
      id: snapshotRef.id,
      orgId: organization.id,
      type,
      value,
      recordedAt: now.toISOString(),
      recordedBy: user.uid,
    }

    batch.set(snapshotRef, snapshotData)

    await batch.commit()

    return {
      success: true,
      data: { metric: metricData },
    }
  } catch (error) {
    console.error('Update metric error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update metric' },
    }
  }
}

// Helper to convert Firestore Timestamp to ISO string
function serializeTimestamp(timestamp: unknown): string {
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return (timestamp as { toDate: () => Date }).toDate().toISOString()
  }
  if (timestamp && typeof timestamp === 'object' && '_seconds' in timestamp) {
    return new Date((timestamp as { _seconds: number })._seconds * 1000).toISOString()
  }
  return new Date().toISOString()
}

export async function getMetrics(): Promise<ApiResponse<Metric[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated or no organization selected' },
      }
    }

    const db = adminDb()
    const snapshot = await db
      .collection(COLLECTIONS.METRICS)
      .where('orgId', '==', orgContext.organization.id)
      .get()

    const metrics = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        updatedAt: serializeTimestamp(data.updatedAt),
      }
    }) as unknown as Metric[]

    return {
      success: true,
      data: metrics,
    }
  } catch (error) {
    console.error('Get metrics error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch metrics' },
    }
  }
}

export async function getMetricSnapshots(
  type: MetricType,
  days: number = 30
): Promise<ApiResponse<MetricSnapshot[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated or no organization selected' },
      }
    }

    const db = adminDb()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString()

    const snapshot = await db
      .collection(COLLECTIONS.METRIC_SNAPSHOTS)
      .where('orgId', '==', orgContext.organization.id)
      .where('type', '==', type)
      .where('recordedAt', '>=', startDateStr)
      .orderBy('recordedAt', 'asc')
      .get()

    const snapshots = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        recordedAt: serializeTimestamp(data.recordedAt),
      }
    }) as unknown as MetricSnapshot[]

    return {
      success: true,
      data: snapshots,
    }
  } catch (error) {
    console.error('Get metric snapshots error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch metric history' },
    }
  }
}
