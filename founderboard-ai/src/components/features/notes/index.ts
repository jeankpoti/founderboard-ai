/**
 * Notes Feature Components
 *
 * This barrel file exports all components for the Notes feature.
 *
 * WHAT IS A BARREL FILE?
 * A barrel file re-exports items from multiple files.
 * This allows cleaner imports elsewhere:
 * - Instead of: import { NotesPage } from '@/components/features/notes/NotesPage'
 * - You can do: import { NotesPage } from '@/components/features/notes'
 */

export { NotesPage } from './NotesPage'
export { NoteModal } from './NoteModal'
