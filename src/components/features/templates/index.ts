/**
 * Templates Feature Components
 *
 * This barrel file exports all components for the Templates feature.
 *
 * WHAT IS A BARREL FILE?
 * A barrel file re-exports items from multiple files.
 * This allows cleaner imports elsewhere:
 * - Instead of: import { TemplateLibrary } from '@/components/features/templates/TemplateLibrary'
 * - You can do: import { TemplateLibrary } from '@/components/features/templates'
 */

export { TemplateLibrary } from './TemplateLibrary'
export { TemplateModal } from './TemplateModal'
export { UseTemplateModal } from './UseTemplateModal'
