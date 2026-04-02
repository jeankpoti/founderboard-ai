// Application constants

export const APP_NAME = 'FounderBoard AI'
export const APP_DESCRIPTION = 'All-in-one AI-powered dashboard for startup founders'

// Session configuration
export const SESSION_COOKIE_NAME = 'session'
export const SESSION_EXPIRY_DAYS = 5

// Rate limiting
export const AI_RATE_LIMIT_PER_MINUTE = 10
export const AI_RATE_LIMIT_PER_DAY = 100
export const API_RATE_LIMIT_PER_MINUTE = 100

// Task statuses
export const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'done'] as const

// Metric types
export const METRIC_TYPES = ['mrr', 'users', 'churn', 'conversions'] as const

// Roles in order of hierarchy
export const ROLES = ['owner', 'admin', 'member', 'viewer'] as const
