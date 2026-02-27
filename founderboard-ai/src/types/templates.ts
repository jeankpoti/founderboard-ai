/**
 * Templates Types & Schemas
 *
 * This file defines all data structures for the Templates feature.
 *
 * WHAT IS THE TEMPLATES FEATURE?
 * Templates are reusable document/note structures that help users:
 * - Quickly create consistent documents
 * - Follow best practices for common tasks
 * - Save time on repetitive work
 *
 * EXAMPLES:
 * - Meeting agenda template
 * - Investor update email template
 * - Due diligence checklist template
 * - Weekly report template
 */

import { z } from 'zod'

// ========================================
// TEMPLATE TYPES
// ========================================

/**
 * Categories for organizing templates.
 *
 * Each category groups related templates together,
 * making it easier for users to find what they need.
 */
export type TemplateCategory =
  | 'meeting'
  | 'investor'
  | 'report'
  | 'planning'
  | 'hr'
  | 'legal'
  | 'custom'

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'meeting',
  'investor',
  'report',
  'planning',
  'hr',
  'legal',
  'custom',
]

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  meeting: 'Meetings',
  investor: 'Investor Relations',
  report: 'Reports',
  planning: 'Planning',
  hr: 'HR & Team',
  legal: 'Legal',
  custom: 'Custom',
}

export const TEMPLATE_CATEGORY_ICONS: Record<TemplateCategory, string> = {
  meeting: '🤝',
  investor: '💰',
  report: '📊',
  planning: '🎯',
  hr: '👥',
  legal: '📜',
  custom: '✨',
}

export const TEMPLATE_CATEGORY_COLORS: Record<TemplateCategory, string> = {
  meeting: 'bg-blue-100 text-blue-700',
  investor: 'bg-green-100 text-green-700',
  report: 'bg-purple-100 text-purple-700',
  planning: 'bg-amber-100 text-amber-700',
  hr: 'bg-pink-100 text-pink-700',
  legal: 'bg-slate-100 text-slate-700',
  custom: 'bg-cyan-100 text-cyan-700',
}

/**
 * Template output types.
 *
 * Defines what kind of content the template creates.
 */
export type TemplateOutputType = 'note' | 'document' | 'checklist' | 'email'

export const TEMPLATE_OUTPUT_TYPES: TemplateOutputType[] = [
  'note',
  'document',
  'checklist',
  'email',
]

export const TEMPLATE_OUTPUT_LABELS: Record<TemplateOutputType, string> = {
  note: 'Note',
  document: 'Document',
  checklist: 'Checklist',
  email: 'Email',
}

// ========================================
// TEMPLATE INTERFACE
// ========================================

/**
 * Represents a template.
 *
 * Templates have content with placeholders that get filled in
 * when the template is used.
 */
export interface Template {
  /** Unique identifier */
  id: string

  /** Organization this belongs to */
  orgId: string

  /** Template name */
  name: string

  /** Brief description of what this template is for */
  description: string

  /** Category for organization */
  category: TemplateCategory

  /** What type of content does this create? */
  outputType: TemplateOutputType

  /**
   * Template content with placeholders.
   *
   * PLACEHOLDER SYNTAX:
   * Use {{placeholder_name}} for variables that get replaced.
   *
   * EXAMPLE:
   * "Meeting with {{investor_name}} on {{date}}"
   * becomes "Meeting with Sequoia on March 15, 2024"
   */
  content: string

  /**
   * Variables that can be filled in.
   * Extracted from the content placeholders.
   */
  variables: TemplateVariable[]

  /** Is this a system-provided template? */
  isSystem: boolean

  /** Is this template public/shared with team? */
  isPublic: boolean

  /** Tags for searching/filtering */
  tags: string[]

  /** Number of times this template has been used */
  usageCount: number

  /** Who created this template */
  createdBy: string
  createdByName?: string

  /** Last editor */
  lastEditedBy?: string
  lastEditedByName?: string

  /** Timestamps */
  createdAt: string
  updatedAt: string
}

/**
 * Represents a variable in a template.
 *
 * Variables are the placeholders that users fill in
 * when using a template.
 */
export interface TemplateVariable {
  /** Variable name (e.g., "investor_name") */
  name: string

  /** Display label (e.g., "Investor Name") */
  label: string

  /** Type of input */
  type: 'text' | 'date' | 'number' | 'select' | 'textarea'

  /** Is this required? */
  required: boolean

  /** Default value */
  defaultValue?: string

  /** Options for select type */
  options?: string[]

  /** Placeholder text */
  placeholder?: string
}

// ========================================
// VALIDATION SCHEMAS
// ========================================

/**
 * Schema for template variables.
 */
const templateVariableSchema = z.object({
  name: z.string().min(1, 'Variable name is required'),
  label: z.string().min(1, 'Variable label is required'),
  type: z.enum(['text', 'date', 'number', 'select', 'textarea']).default('text'),
  required: z.boolean().default(false),
  defaultValue: z.string().optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
})

/**
 * Schema for creating a template.
 */
export const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less'),

  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .default(''),

  category: z
    .enum(TEMPLATE_CATEGORIES as [TemplateCategory, ...TemplateCategory[]])
    .default('custom'),

  outputType: z
    .enum(TEMPLATE_OUTPUT_TYPES as [TemplateOutputType, ...TemplateOutputType[]])
    .default('note'),

  content: z
    .string()
    .min(1, 'Content is required')
    .max(50000, 'Content is too long'),

  variables: z.array(templateVariableSchema).default([]),

  isPublic: z.boolean().default(true),

  tags: z.array(z.string()).default([]),
})

/**
 * Schema for updating a template.
 */
export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  category: z.enum(TEMPLATE_CATEGORIES as [TemplateCategory, ...TemplateCategory[]]).optional(),
  outputType: z.enum(TEMPLATE_OUTPUT_TYPES as [TemplateOutputType, ...TemplateOutputType[]]).optional(),
  content: z.string().min(1).max(50000).optional(),
  variables: z.array(templateVariableSchema).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

// ========================================
// TYPE INFERENCE
// ========================================

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Extract variable names from template content.
 *
 * Finds all {{variable_name}} patterns in the content.
 *
 * @param content - Template content with placeholders
 * @returns Array of variable names
 *
 * @example
 * extractVariables("Hello {{name}}, your meeting is on {{date}}")
 * // Returns: ["name", "date"]
 */
export function extractVariables(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g
  const matches: string[] = []
  let match

  while ((match = regex.exec(content)) !== null) {
    const variableName = match[1].trim()
    if (!matches.includes(variableName)) {
      matches.push(variableName)
    }
  }

  return matches
}

/**
 * Apply variable values to template content.
 *
 * Replaces all {{variable_name}} with actual values.
 *
 * @param content - Template content with placeholders
 * @param values - Object mapping variable names to values
 * @returns Content with placeholders replaced
 *
 * @example
 * applyVariables("Hello {{name}}", { name: "John" })
 * // Returns: "Hello John"
 */
export function applyVariables(
  content: string,
  values: Record<string, string>
): string {
  let result = content

  for (const [name, value] of Object.entries(values)) {
    const regex = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g')
    result = result.replace(regex, value)
  }

  return result
}

/**
 * Convert variable name to label.
 *
 * Transforms snake_case to Title Case.
 *
 * @param name - Variable name (e.g., "investor_name")
 * @returns Human-readable label (e.g., "Investor Name")
 */
export function variableNameToLabel(name: string): string {
  return name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Create default variable definitions from extracted names.
 *
 * @param names - Array of variable names
 * @returns Array of TemplateVariable objects with defaults
 */
export function createDefaultVariables(names: string[]): TemplateVariable[] {
  return names.map((name) => ({
    name,
    label: variableNameToLabel(name),
    type: name.includes('date') ? 'date' : 'text',
    required: true,
  }))
}

/**
 * Validate that all required variables have values.
 *
 * @param template - The template with variable definitions
 * @param values - The values provided
 * @returns Array of missing required variable names
 */
export function getMissingRequiredVariables(
  template: Template,
  values: Record<string, string>
): string[] {
  return template.variables
    .filter((v) => v.required && !values[v.name])
    .map((v) => v.label)
}

// ========================================
// DEFAULT TEMPLATES
// ========================================

/**
 * System-provided default templates.
 *
 * These templates are added to new organizations
 * to help users get started quickly.
 */
export const DEFAULT_TEMPLATES: Omit<
  Template,
  'id' | 'orgId' | 'createdBy' | 'createdAt' | 'updatedAt'
>[] = [
  {
    name: 'Meeting Agenda',
    description: 'Standard meeting agenda template with objectives and action items',
    category: 'meeting',
    outputType: 'note',
    content: `# Meeting: {{meeting_title}}

**Date:** {{date}}
**Attendees:** {{attendees}}
**Duration:** {{duration}}

## Objectives
-

## Agenda
1. Welcome and introductions
2. Review of previous action items
3. Main discussion topics
   -
4. Next steps and action items
5. Q&A

## Notes


## Action Items
| Item | Owner | Due Date |
|------|-------|----------|
|      |       |          |

## Next Meeting
- Date:
- Topics to cover:
`,
    variables: [
      { name: 'meeting_title', label: 'Meeting Title', type: 'text', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'attendees', label: 'Attendees', type: 'text', required: false },
      { name: 'duration', label: 'Duration', type: 'text', required: false, defaultValue: '1 hour' },
    ],
    isSystem: true,
    isPublic: true,
    tags: ['meeting', 'agenda'],
    usageCount: 0,
  },
  {
    name: 'Investor Update Email',
    description: 'Monthly investor update email template',
    category: 'investor',
    outputType: 'email',
    content: `Subject: {{company_name}} - {{month}} Investor Update

Hi {{investor_name}},

Hope you're doing well! Here's our monthly update for {{month}}.

## Key Highlights
-

## Metrics
| Metric | This Month | Last Month | Change |
|--------|------------|------------|--------|
| MRR    | $          | $          |        |
| Users  |            |            |        |
| Churn  |            |            |        |

## What's Working
-

## Challenges
-

## Focus for Next Month
-

## How You Can Help
-

Thanks for your continued support!

Best,
{{sender_name}}
{{company_name}}
`,
    variables: [
      { name: 'company_name', label: 'Company Name', type: 'text', required: true },
      { name: 'month', label: 'Month', type: 'text', required: true },
      { name: 'investor_name', label: 'Investor Name', type: 'text', required: true },
      { name: 'sender_name', label: 'Your Name', type: 'text', required: true },
    ],
    isSystem: true,
    isPublic: true,
    tags: ['investor', 'update', 'email'],
    usageCount: 0,
  },
  {
    name: 'Weekly Team Report',
    description: 'Weekly progress report for team updates',
    category: 'report',
    outputType: 'note',
    content: `# Weekly Report: {{week_ending}}

## Summary
Brief overview of the week.

## Accomplishments
-

## In Progress
-

## Blockers
-

## Key Metrics
-

## Next Week's Priorities
1.
2.
3.

## Team Highlights
Shoutouts or notable achievements.

## Resources Needed
-
`,
    variables: [
      { name: 'week_ending', label: 'Week Ending', type: 'date', required: true },
    ],
    isSystem: true,
    isPublic: true,
    tags: ['report', 'weekly', 'team'],
    usageCount: 0,
  },
  {
    name: 'Due Diligence Checklist',
    description: 'Fundraising due diligence preparation checklist',
    category: 'investor',
    outputType: 'checklist',
    content: `# Due Diligence Checklist

**Round:** {{round_name}}
**Investor:** {{investor_name}}
**Date Started:** {{date}}

## Company Documents
- [ ] Certificate of Incorporation
- [ ] Bylaws
- [ ] Board meeting minutes
- [ ] Shareholder agreements
- [ ] Cap table

## Financial Documents
- [ ] Historical financials (3 years)
- [ ] Current year budget
- [ ] Financial projections (3-5 years)
- [ ] Bank statements
- [ ] Tax returns

## Legal
- [ ] Material contracts
- [ ] IP assignments
- [ ] Employment agreements
- [ ] Pending litigation
- [ ] Regulatory compliance

## Product & Technology
- [ ] Product roadmap
- [ ] Technical architecture
- [ ] Security audit
- [ ] Data privacy compliance

## Team
- [ ] Org chart
- [ ] Key employee bios
- [ ] Employee option pool details

## Customer & Market
- [ ] Customer list (anonymized)
- [ ] Customer contracts
- [ ] Market research
- [ ] Competitive analysis

## Notes

`,
    variables: [
      { name: 'round_name', label: 'Round Name', type: 'text', required: true },
      { name: 'investor_name', label: 'Investor Name', type: 'text', required: true },
      { name: 'date', label: 'Date Started', type: 'date', required: true },
    ],
    isSystem: true,
    isPublic: true,
    tags: ['investor', 'due-diligence', 'checklist', 'fundraising'],
    usageCount: 0,
  },
]
