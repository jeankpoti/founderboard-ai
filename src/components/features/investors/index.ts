/**
 * Investors Components - Barrel Export
 *
 * WHAT IS A BARREL FILE?
 * - A barrel file re-exports components from a directory
 * - Instead of: import { InvestorCard } from './investors/InvestorCard'
 * - You can do: import { InvestorCard } from './investors'
 *
 * BENEFITS:
 * - Cleaner import statements
 * - Single place to control what's exported
 * - Easier refactoring (change internal structure without updating imports)
 */

export { InvestorCard } from './InvestorCard'
export { InvestorModal } from './InvestorModal'
export { InvestorPipeline } from './InvestorPipeline'
