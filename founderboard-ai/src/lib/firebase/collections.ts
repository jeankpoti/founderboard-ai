import { collection, type CollectionReference, type DocumentData } from 'firebase/firestore'
import { db as getDb } from './client'

// Collection names for both client and server-side usage
export const COLLECTIONS = {
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  MEMBERSHIPS: 'memberships',
  INVITATIONS: 'invitations',
  METRICS: 'metrics',
  METRIC_SNAPSHOTS: 'metric_snapshots',
  TASKS: 'tasks',
  AI_CONTENT: 'ai_content',
  ACTIVITY_LOGS: 'activity_logs',
} as const

// Collection reference getters for client-side usage
// These are functions to avoid Firebase initialization during build
export function getUsersCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.USERS)
}

export function getOrganizationsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.ORGANIZATIONS)
}

export function getMembershipsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.MEMBERSHIPS)
}

export function getInvitationsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.INVITATIONS)
}

export function getMetricsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.METRICS)
}

export function getMetricSnapshotsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.METRIC_SNAPSHOTS)
}

export function getTasksCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.TASKS)
}

export function getAiContentCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.AI_CONTENT)
}

export function getActivityLogsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.ACTIVITY_LOGS)
}
