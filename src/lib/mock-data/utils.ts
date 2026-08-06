/**
 * Mock Data Utilities
 *
 * Helper functions for generating realistic mock data.
 */

import type { Integration, IntegrationType } from '@/types/integrations'

/**
 * Generate a unique ID (UUID v4 format).
 */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Generate a random integer between min and max (inclusive).
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate a random float between min and max with specified decimal places.
 */
export function randomFloat(min: number, max: number, decimals: number = 2): number {
  const value = Math.random() * (max - min) + min
  return Number(value.toFixed(decimals))
}

/**
 * Generate an array of dates for the last N days.
 */
export function generateDateRange(days: number): string[] {
  const dates: string[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }

  return dates
}

/**
 * Generate a date string N days ago.
 */
export function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

/**
 * Pick a random item from an array.
 */
export function randomPick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Pick multiple random items from an array.
 */
export function randomPickMultiple<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, array.length))
}

/**
 * Generate a random weighted value that trends upward over time.
 */
export function generateTrendingValue(
  baseValue: number,
  index: number,
  totalDays: number,
  variance: number = 0.1
): number {
  // Add slight upward trend
  const trend = (index / totalDays) * baseValue * 0.15
  // Add daily variance
  const dailyVariance = (Math.random() - 0.5) * baseValue * variance
  return Math.round(baseValue + trend + dailyVariance)
}

/**
 * Check if an integration is connected and active.
 */
export function isIntegrationConnected(
  integrations: Integration[] | undefined,
  type: IntegrationType
): boolean {
  if (!integrations) return false
  return integrations.some((i) => i.type === type && i.status === 'active')
}

/**
 * Get the integration ID for a specific type.
 */
export function getActiveIntegrationId(
  integrations: Integration[] | undefined,
  type: IntegrationType
): string | null {
  if (!integrations) return null
  const integration = integrations.find((i) => i.type === type && i.status === 'active')
  return integration?.id ?? null
}

/**
 * Constants for mock data.
 */
export const MOCK_ORG_ID = 'mock-org-demo'
export const MOCK_INTEGRATION_PREFIX = 'mock-integration'

/**
 * Team member data for realistic commits/assignments.
 */
export const MOCK_TEAM_MEMBERS = [
  { name: 'Sarah Chen', email: 'sarah@founderboard.io', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { name: 'Alex Rivera', email: 'alex@founderboard.io', avatar: 'https://i.pravatar.cc/150?u=alex' },
  { name: 'Jordan Kim', email: 'jordan@founderboard.io', avatar: 'https://i.pravatar.cc/150?u=jordan' },
  { name: 'Taylor Smith', email: 'taylor@founderboard.io', avatar: 'https://i.pravatar.cc/150?u=taylor' },
  { name: 'Morgan Lee', email: 'morgan@founderboard.io', avatar: 'https://i.pravatar.cc/150?u=morgan' },
]
