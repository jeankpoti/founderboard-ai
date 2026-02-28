/**
 * Firebase Collections Configuration
 *
 * This file defines all the Firestore collection names used in the app.
 *
 * WHAT IS A COLLECTION?
 * - In Firestore (our database), data is organized into "collections"
 * - Think of a collection like a folder that holds similar items
 * - For example, the "users" collection holds all user documents
 *
 * WHY USE CONSTANTS?
 * - We define collection names as constants to avoid typos
 * - If we type "users" wrong somewhere, we get an error
 * - Makes it easy to rename collections in one place
 */

import { collection, type CollectionReference, type DocumentData } from 'firebase/firestore'
import { db as getDb } from './client'

/**
 * COLLECTIONS object holds all our database collection names
 *
 * "as const" at the end makes TypeScript treat these as exact strings,
 * not just "any string". This helps catch errors.
 */
export const COLLECTIONS = {
  // ========================================
  // CORE COLLECTIONS (Already existed)
  // ========================================

  /** Stores user profiles (name, email, photo, etc.) */
  USERS: 'users',

  /** Stores organization/company data */
  ORGANIZATIONS: 'organizations',

  /** Links users to organizations with their role (owner, admin, member, viewer) */
  MEMBERSHIPS: 'memberships',

  /** Pending invitations to join an organization */
  INVITATIONS: 'invitations',

  /** Current metric values (MRR, users, churn, etc.) */
  METRICS: 'metrics',

  /** Historical snapshots of metrics over time */
  METRIC_SNAPSHOTS: 'metric_snapshots',

  /** Kanban board tasks */
  TASKS: 'tasks',

  /** AI-generated content storage */
  AI_CONTENT: 'ai_content',

  /** AI chat conversations (groups messages together) */
  AI_CONVERSATIONS: 'ai_conversations',

  /** Individual messages within AI conversations */
  AI_MESSAGES: 'ai_messages',

  /** System activity logs */
  ACTIVITY_LOGS: 'activity_logs',

  // ========================================
  // PHASE 1: TEAM & COLLABORATION
  // ========================================

  /**
   * Activity feed items - tracks what's happening in the org
   * Examples: "John created a task", "Sarah updated MRR"
   */
  ACTIVITIES: 'activities',

  // ========================================
  // PHASE 2: BUSINESS OPERATIONS
  // ========================================

  /**
   * Investor CRM - stores investor contacts
   * Like a contact list specifically for investors
   */
  INVESTORS: 'investors',

  /**
   * Meetings scheduled with investors
   * Linked to investors via investorId
   */
  INVESTOR_MEETINGS: 'investor_meetings',

  /**
   * Interactions with investors (emails, calls, notes)
   * Creates a timeline of all touchpoints
   */
  INVESTOR_INTERACTIONS: 'investor_interactions',

  /**
   * Fundraising rounds (Seed, Series A, etc.)
   * Tracks target amount, raised amount, status
   */
  FUNDRAISING_ROUNDS: 'fundraising_rounds',

  /**
   * Term sheets received from investors
   * Documents the terms of potential investments
   */
  TERM_SHEETS: 'term_sheets',

  /**
   * Cap table entries - who owns what
   * Tracks shares, ownership percentages, vesting
   */
  CAP_TABLE: 'cap_table',

  /**
   * OKR Objectives - high-level goals
   * Example: "Increase revenue by 50%"
   */
  OBJECTIVES: 'objectives',

  /**
   * Key Results - measurable outcomes for objectives
   * Example: "Reach $100K MRR" (under "Increase revenue" objective)
   */
  KEY_RESULTS: 'key_results',

  /**
   * Check-ins for key results - progress updates
   * Tracks value changes over time
   */
  KEY_RESULT_CHECK_INS: 'key_result_check_ins',

  // ========================================
  // PHASE 3: CONTENT & KNOWLEDGE
  // ========================================

  /**
   * Uploaded documents (pitch decks, contracts, etc.)
   * Stores metadata; actual files go to Firebase Storage
   */
  DOCUMENTS: 'documents',

  /**
   * Folders to organize documents
   * Creates a folder hierarchy like on your computer
   */
  DOCUMENT_FOLDERS: 'document_folders',

  /**
   * Document access permissions
   * Tracks who can view/edit each document
   */
  DOCUMENT_ACCESS: 'document_access',

  /**
   * Notes and wiki pages
   * Markdown content for meeting notes, ideas, etc.
   */
  NOTES: 'notes',

  /**
   * Folders to organize notes
   */
  NOTE_FOLDERS: 'note_folders',

  /**
   * Reusable templates (email templates, doc templates)
   * Contains content with {{variable}} placeholders
   */
  TEMPLATES: 'templates',

  // ========================================
  // PHASE 4: PLANNING & INTEGRATIONS
  // ========================================

  /**
   * Product roadmap items
   * Features/projects with timeline and status
   */
  ROADMAP_ITEMS: 'roadmap_items',

  /**
   * Roadmap milestones
   * Important dates/achievements on the roadmap
   */
  ROADMAP_MILESTONES: 'roadmap_milestones',

  /**
   * Calendar events
   * Meetings, deadlines, reminders
   */
  CALENDAR_EVENTS: 'calendar_events',

  /**
   * Third-party integrations (Slack, GitHub, Stripe, etc.)
   * Stores connection status and credentials (encrypted)
   */
  INTEGRATIONS: 'integrations',

  /**
   * Integration activity logs
   * Tracks sync operations, errors, etc.
   */
  INTEGRATION_LOGS: 'integration_logs',

  /**
   * App Store / Play Store metrics
   * Downloads, revenue, ratings from mobile apps
   */
  APP_STORE_METRICS: 'app_store_metrics',

  /**
   * App reviews from stores
   * User reviews with ratings and responses
   */
  APP_REVIEWS: 'app_reviews',

  // ========================================
  // STRIPE INTEGRATION DATA
  // ========================================

  /**
   * Stripe revenue metrics
   * MRR, revenue, subscription counts per period
   */
  STRIPE_METRICS: 'stripe_metrics',

  /**
   * Stripe charges/payments
   * Individual payment records
   */
  STRIPE_CHARGES: 'stripe_charges',

  // ========================================
  // GITHUB INTEGRATION DATA
  // ========================================

  /**
   * GitHub commits
   * Commit records from connected repositories
   */
  GITHUB_COMMITS: 'github_commits',

  /**
   * GitHub pull requests
   * PR records from connected repositories
   */
  GITHUB_PULL_REQUESTS: 'github_pull_requests',

  /**
   * GitHub issues
   * Issue records from connected repositories
   */
  GITHUB_ISSUES: 'github_issues',

  // ========================================
  // LINEAR INTEGRATION DATA
  // ========================================

  /**
   * Linear issues
   * Issue records from Linear
   */
  LINEAR_ISSUES: 'linear_issues',
} as const

// ========================================
// COLLECTION REFERENCE GETTERS
// ========================================
/**
 * These functions return "collection references" for client-side usage.
 *
 * WHY FUNCTIONS INSTEAD OF CONSTANTS?
 * - Firebase needs to be initialized before we can create references
 * - By using functions, we delay creation until Firebase is ready
 * - This prevents errors during Next.js build process
 */

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

export function getAiConversationsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.AI_CONVERSATIONS)
}

export function getAiMessagesCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.AI_MESSAGES)
}

export function getActivityLogsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.ACTIVITY_LOGS)
}

// New collection getters for Phase 1-4 features
export function getActivitiesCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.ACTIVITIES)
}

export function getInvestorsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.INVESTORS)
}

export function getInvestorMeetingsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.INVESTOR_MEETINGS)
}

export function getFundraisingRoundsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.FUNDRAISING_ROUNDS)
}

export function getCapTableCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.CAP_TABLE)
}

export function getObjectivesCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.OBJECTIVES)
}

export function getKeyResultsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.KEY_RESULTS)
}

export function getDocumentsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.DOCUMENTS)
}

export function getNotesCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.NOTES)
}

export function getTemplatesCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.TEMPLATES)
}

export function getRoadmapItemsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.ROADMAP_ITEMS)
}

export function getCalendarEventsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.CALENDAR_EVENTS)
}

export function getIntegrationsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.INTEGRATIONS)
}

export function getAppStoreMetricsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.APP_STORE_METRICS)
}

export function getAppReviewsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.APP_REVIEWS)
}

export function getStripeMetricsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.STRIPE_METRICS)
}

export function getStripeChargesCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.STRIPE_CHARGES)
}

export function getGitHubCommitsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.GITHUB_COMMITS)
}

export function getGitHubPullRequestsCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.GITHUB_PULL_REQUESTS)
}

export function getGitHubIssuesCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.GITHUB_ISSUES)
}

export function getLinearIssuesCollection(): CollectionReference<DocumentData> {
  return collection(getDb(), COLLECTIONS.LINEAR_ISSUES)
}
