/**
 * Activity Feature Exports
 *
 * This is a "barrel file" that re-exports all components from this folder.
 *
 * WHY USE A BARREL FILE?
 * - Cleaner imports in other files
 * - Instead of: import { ActivityFeed } from '@/components/features/activity/ActivityFeed'
 * - You can write: import { ActivityFeed } from '@/components/features/activity'
 *
 * This is a common pattern in larger codebases.
 */

export { ActivityFeed } from './ActivityFeed'
export { ActivityItem } from './ActivityItem'
