/**
 * Fundraising Types & Schemas
 *
 * This file defines all data structures for the Fundraising feature.
 *
 * WHAT IS FUNDRAISING?
 * - Fundraising is the process of raising money from investors
 * - Startups typically do this in "rounds" (Seed, Series A, B, etc.)
 * - This feature helps you track your fundraising progress
 *
 * KEY CONCEPTS:
 * - Round: A fundraising event (e.g., "Seed Round" raising $1.5M)
 * - Term Sheet: A document outlining investment terms from an investor
 * - Cap Table: Shows who owns what percentage of your company
 * - Valuation: How much your company is "worth" (used for calculating ownership)
 */

import { z } from 'zod'

// ========================================
// FUNDRAISING ROUND TYPES
// ========================================

/**
 * What stage of funding is this round?
 *
 * Funding stages typically progress in order:
 * - pre_seed: Very early, often friends/family (~$50K-$500K)
 * - seed: First institutional round (~$500K-$3M)
 * - series_a: First major VC round (~$3M-$15M)
 * - series_b: Growth stage (~$15M-$50M)
 * - series_c: Later stage (~$50M+)
 * - bridge: Small round between larger rounds
 */
export type RoundType =
  | 'pre_seed'
  | 'seed'
  | 'series_a'
  | 'series_b'
  | 'series_c'
  | 'bridge'
  | 'other'

/** Array of round types for dropdowns */
export const ROUND_TYPES: RoundType[] = [
  'pre_seed',
  'seed',
  'series_a',
  'series_b',
  'series_c',
  'bridge',
  'other',
]

/** Human-readable labels for round types */
export const ROUND_TYPE_LABELS: Record<RoundType, string> = {
  pre_seed: 'Pre-Seed',
  seed: 'Seed',
  series_a: 'Series A',
  series_b: 'Series B',
  series_c: 'Series C',
  bridge: 'Bridge',
  other: 'Other',
}

/**
 * What's the current status of this fundraising round?
 *
 * - planning: You're preparing materials, haven't started outreach
 * - active: You're actively meeting with investors
 * - closing: You have term sheets, finalizing the deal
 * - closed: Money is in the bank, round is complete
 * - paused: Taking a break from fundraising
 */
export type RoundStatus =
  | 'planning'
  | 'active'
  | 'closing'
  | 'closed'
  | 'paused'

export const ROUND_STATUSES: RoundStatus[] = [
  'planning',
  'active',
  'closing',
  'closed',
  'paused',
]

export const ROUND_STATUS_LABELS: Record<RoundStatus, string> = {
  planning: 'Planning',
  active: 'Active',
  closing: 'Closing',
  closed: 'Closed',
  paused: 'Paused',
}

export const ROUND_STATUS_COLORS: Record<RoundStatus, string> = {
  planning: 'bg-slate-100 text-slate-700',
  active: 'bg-blue-100 text-blue-700',
  closing: 'bg-amber-100 text-amber-700',
  closed: 'bg-green-100 text-green-700',
  paused: 'bg-gray-100 text-gray-500',
}

// ========================================
// FUNDRAISING ROUND INTERFACE
// ========================================

/**
 * Represents a fundraising round.
 *
 * A round is a single fundraising event, like "Seed Round" or "Series A".
 * This tracks the target amount, progress, and valuation details.
 */
export interface FundraisingRound {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** Name of the round (e.g., "Seed Round 2024") */
  name: string

  /** Type of round (seed, series_a, etc.) */
  type: RoundType

  /** Current status */
  status: RoundStatus

  /** How much are you trying to raise? */
  targetAmount: number

  /** How much have you raised so far? (commitments + closed) */
  raisedAmount: number

  /** Currency code (USD, EUR, etc.) */
  currency: string

  /**
   * Pre-money valuation
   *
   * WHAT IS PRE-MONEY VALUATION?
   * - The value of your company BEFORE the investment
   * - Example: $10M pre-money + $2M investment = $12M post-money
   */
  preMoneyValuation?: number

  /**
   * Post-money valuation
   *
   * WHAT IS POST-MONEY VALUATION?
   * - The value of your company AFTER the investment
   * - Post-money = Pre-money + Investment Amount
   */
  postMoneyValuation?: number

  /** When did/will the round start? */
  startDate?: string

  /** When did/will the round close? */
  closeDate?: string

  /** Notes about this round */
  notes?: string

  /** Lead investor(s) for this round */
  leadInvestors?: string[]

  /** User who created this */
  createdBy: string

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

// ========================================
// TERM SHEET INTERFACE
// ========================================

/**
 * Status of a term sheet
 *
 * - received: You got a term sheet from an investor
 * - reviewing: You're evaluating the terms
 * - negotiating: Back and forth on terms
 * - accepted: You've agreed to the terms
 * - rejected: You declined this term sheet
 * - expired: Term sheet is no longer valid
 */
export type TermSheetStatus =
  | 'received'
  | 'reviewing'
  | 'negotiating'
  | 'accepted'
  | 'rejected'
  | 'expired'

export const TERM_SHEET_STATUSES: TermSheetStatus[] = [
  'received',
  'reviewing',
  'negotiating',
  'accepted',
  'rejected',
  'expired',
]

export const TERM_SHEET_STATUS_LABELS: Record<TermSheetStatus, string> = {
  received: 'Received',
  reviewing: 'Reviewing',
  negotiating: 'Negotiating',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
}

export const TERM_SHEET_STATUS_COLORS: Record<TermSheetStatus, string> = {
  received: 'bg-blue-100 text-blue-700',
  reviewing: 'bg-purple-100 text-purple-700',
  negotiating: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
}

/**
 * Represents a term sheet from an investor.
 *
 * WHAT IS A TERM SHEET?
 * - A non-binding document outlining the terms of an investment
 * - Includes: amount, valuation, ownership percentage, investor rights
 * - Getting a term sheet is a major milestone!
 */
export interface TermSheet {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** Which round this term sheet is for */
  roundId: string

  /** Which investor sent this (optional - for quick reference) */
  investorId?: string
  investorName: string

  /** Investment amount offered */
  amount: number

  /** Currency */
  currency: string

  /** Pre-money valuation in this offer */
  preMoneyValuation: number

  /** Ownership percentage they would get */
  ownershipPercentage?: number

  /** Current status */
  status: TermSheetStatus

  /** When was this received? */
  receivedAt: string

  /** When does this expire? */
  expiresAt?: string

  /** Key terms or notes */
  keyTerms?: string

  /** Link to the actual document */
  documentUrl?: string

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

// ========================================
// CAP TABLE TYPES
// ========================================

/**
 * Type of shareholder
 *
 * Different types of people/entities that can own shares:
 * - founder: Company founders
 * - employee: Team members with equity
 * - investor: People/firms who invested
 * - advisor: Advisors with equity compensation
 * - option_pool: Reserved for future employees
 */
export type ShareholderType =
  | 'founder'
  | 'employee'
  | 'investor'
  | 'advisor'
  | 'option_pool'

export const SHAREHOLDER_TYPES: ShareholderType[] = [
  'founder',
  'employee',
  'investor',
  'advisor',
  'option_pool',
]

export const SHAREHOLDER_TYPE_LABELS: Record<ShareholderType, string> = {
  founder: 'Founder',
  employee: 'Employee',
  investor: 'Investor',
  advisor: 'Advisor',
  option_pool: 'Option Pool',
}

export const SHAREHOLDER_TYPE_COLORS: Record<ShareholderType, string> = {
  founder: 'bg-purple-500',
  employee: 'bg-blue-500',
  investor: 'bg-green-500',
  advisor: 'bg-amber-500',
  option_pool: 'bg-gray-400',
}

/**
 * Type of shares
 *
 * - common: Regular shares (founders, employees usually have these)
 * - preferred: Investor shares (have special rights like liquidation preference)
 * - options: Right to buy shares at a set price (not actual shares yet)
 */
export type ShareClass =
  | 'common'
  | 'preferred_seed'
  | 'preferred_a'
  | 'preferred_b'
  | 'options'

export const SHARE_CLASSES: ShareClass[] = [
  'common',
  'preferred_seed',
  'preferred_a',
  'preferred_b',
  'options',
]

export const SHARE_CLASS_LABELS: Record<ShareClass, string> = {
  common: 'Common Stock',
  preferred_seed: 'Preferred (Seed)',
  preferred_a: 'Preferred (Series A)',
  preferred_b: 'Preferred (Series B)',
  options: 'Stock Options',
}

/**
 * Represents an entry in the cap table.
 *
 * WHAT IS A CAP TABLE?
 * - Short for "Capitalization Table"
 * - Lists all shareholders and their ownership percentages
 * - Essential for understanding who owns what
 * - Updated after each funding round
 */
export interface CapTableEntry {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** Name of the shareholder */
  shareholderName: string

  /** Type of shareholder */
  shareholderType: ShareholderType

  /** Number of shares owned */
  shares: number

  /** Type of shares */
  shareClass: ShareClass

  /** Email (for linking to investors or team members) */
  email?: string

  /** Related investor ID (if this is an investor) */
  investorId?: string

  /** Notes */
  notes?: string

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

/**
 * Schema for creating a fundraising round.
 */
export const createRoundSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less'),

  type: z.enum(ROUND_TYPES as [RoundType, ...RoundType[]]),

  status: z
    .enum(ROUND_STATUSES as [RoundStatus, ...RoundStatus[]])
    .default('planning'),

  targetAmount: z.number().min(0, 'Target amount must be positive'),

  raisedAmount: z.number().min(0).default(0),

  currency: z.string().default('USD'),

  preMoneyValuation: z.number().min(0).optional(),

  postMoneyValuation: z.number().min(0).optional(),

  startDate: z.string().optional(),

  closeDate: z.string().optional(),

  notes: z.string().max(5000).optional(),

  leadInvestors: z.array(z.string()).optional(),
})

export const updateRoundSchema = createRoundSchema.partial()

/**
 * Schema for creating a term sheet.
 */
export const createTermSheetSchema = z.object({
  roundId: z.string().min(1, 'Round is required'),

  investorId: z.string().optional(),

  investorName: z
    .string()
    .min(1, 'Investor name is required')
    .max(200),

  amount: z.number().min(0, 'Amount must be positive'),

  currency: z.string().default('USD'),

  preMoneyValuation: z.number().min(0, 'Valuation must be positive'),

  ownershipPercentage: z.number().min(0).max(100).optional(),

  status: z
    .enum(TERM_SHEET_STATUSES as [TermSheetStatus, ...TermSheetStatus[]])
    .default('received'),

  receivedAt: z.string().min(1, 'Received date is required'),

  expiresAt: z.string().optional(),

  keyTerms: z.string().max(10000).optional(),

  documentUrl: z.string().url().optional().or(z.literal('')),
})

export const updateTermSheetSchema = createTermSheetSchema.partial()

/**
 * Schema for creating a cap table entry.
 */
export const createCapTableEntrySchema = z.object({
  shareholderName: z
    .string()
    .min(1, 'Shareholder name is required')
    .max(200),

  shareholderType: z.enum(
    SHAREHOLDER_TYPES as [ShareholderType, ...ShareholderType[]]
  ),

  shares: z.number().min(0, 'Shares must be positive'),

  shareClass: z.enum(SHARE_CLASSES as [ShareClass, ...ShareClass[]]),

  email: z.string().email().optional().or(z.literal('')),

  investorId: z.string().optional(),

  notes: z.string().max(5000).optional(),
})

export const updateCapTableEntrySchema = createCapTableEntrySchema.partial()

// ========================================
// TYPE INFERENCE
// ========================================

export type CreateRoundInput = z.infer<typeof createRoundSchema>
export type UpdateRoundInput = z.infer<typeof updateRoundSchema>
export type CreateTermSheetInput = z.infer<typeof createTermSheetSchema>
export type UpdateTermSheetInput = z.infer<typeof updateTermSheetSchema>
export type CreateCapTableEntryInput = z.infer<typeof createCapTableEntrySchema>
export type UpdateCapTableEntryInput = z.infer<typeof updateCapTableEntrySchema>

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Calculate ownership percentage from shares.
 *
 * @param shares - Number of shares owned
 * @param totalShares - Total shares outstanding
 * @returns Percentage of ownership (0-100)
 */
export function calculateOwnership(shares: number, totalShares: number): number {
  if (totalShares === 0) return 0
  return Math.round((shares / totalShares) * 10000) / 100 // 2 decimal places
}

/**
 * Calculate total shares from cap table entries.
 *
 * @param entries - Array of cap table entries
 * @returns Total shares outstanding
 */
export function calculateTotalShares(entries: CapTableEntry[]): number {
  return entries.reduce((total, entry) => total + entry.shares, 0)
}

/**
 * Group cap table entries by shareholder type.
 *
 * @param entries - Array of cap table entries
 * @returns Object with types as keys and entry arrays as values
 */
export function groupCapTableByType(
  entries: CapTableEntry[]
): Record<ShareholderType, CapTableEntry[]> {
  const grouped: Record<ShareholderType, CapTableEntry[]> = {
    founder: [],
    employee: [],
    investor: [],
    advisor: [],
    option_pool: [],
  }

  entries.forEach((entry) => {
    grouped[entry.shareholderType].push(entry)
  })

  return grouped
}

/**
 * Calculate summary stats for the cap table.
 *
 * @param entries - Array of cap table entries
 * @returns Summary statistics
 */
export function getCapTableStats(entries: CapTableEntry[]) {
  const totalShares = calculateTotalShares(entries)
  const grouped = groupCapTableByType(entries)

  const calculateGroupShares = (type: ShareholderType) =>
    grouped[type].reduce((sum, e) => sum + e.shares, 0)

  return {
    totalShares,
    founderShares: calculateGroupShares('founder'),
    employeeShares: calculateGroupShares('employee'),
    investorShares: calculateGroupShares('investor'),
    advisorShares: calculateGroupShares('advisor'),
    optionPoolShares: calculateGroupShares('option_pool'),
    founderOwnership: calculateOwnership(calculateGroupShares('founder'), totalShares),
    investorOwnership: calculateOwnership(calculateGroupShares('investor'), totalShares),
    employeeOwnership: calculateOwnership(calculateGroupShares('employee'), totalShares),
  }
}

/**
 * Format currency amount for display.
 *
 * @param amount - The amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted string like "$1,500,000"
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Calculate round progress percentage.
 *
 * @param raised - Amount raised so far
 * @param target - Target amount
 * @returns Progress percentage (0-100)
 */
export function calculateRoundProgress(raised: number, target: number): number {
  if (target === 0) return 0
  const progress = (raised / target) * 100
  return Math.min(Math.round(progress), 100) // Cap at 100%
}
