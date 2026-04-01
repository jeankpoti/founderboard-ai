'use client'

/**
 * NotesPage Component
 *
 * Main component for viewing and managing notes.
 * Shows a list of notes with search and filtering.
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  RefreshCw,
  FileText,
  Pin,
  PinOff,
  Trash2,
  MoreVertical,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getNotes, deleteNote, toggleNotePin } from '@/lib/actions/notes'
import { NoteModal } from './NoteModal'
import type { Note, NoteCategory } from '@/types/notes'
import {
  NOTE_CATEGORIES,
  NOTE_CATEGORY_LABELS,
  NOTE_CATEGORY_ICONS,
  NOTE_CATEGORY_COLORS,
  getNotePreview,
  getReadingTime,
  sortNotes,
} from '@/types/notes'

// ========================================
// NOTE CARD
// ========================================

interface NoteCardProps {
  note: Note
  onClick: () => void
  onPin: () => void
  onDelete: () => void
}

function NoteCard({ note, onClick, onPin, onDelete }: NoteCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span>{NOTE_CATEGORY_ICONS[note.category]}</span>
            {note.isPinned && <Pin className="h-3 w-3 text-amber-500" />}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onPin()
                }}
              >
                {note.isPinned ? (
                  <>
                    <PinOff className="h-4 w-4 mr-2" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="h-4 w-4 mr-2" />
                    Pin
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="font-medium mb-1 line-clamp-1">{note.title}</h3>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {getNotePreview(note.content) || 'No content'}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant="secondary" className={NOTE_CATEGORY_COLORS[note.category]}>
            {NOTE_CATEGORY_LABELS[note.category]}
          </Badge>
          <span>{formatDate(note.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ========================================
// MAIN COMPONENT
// ========================================

export function NotesPage() {
  const router = useRouter()

  // State
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | undefined>()

  /**
   * Fetch notes.
   */
  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getNotes()
      if (result.success) {
        setNotes(sortNotes(result.data))
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err)
      setError('Failed to load notes.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  /**
   * Handle note click.
   */
  const handleNoteClick = (note: Note) => {
    setSelectedNote(note)
    setIsModalOpen(true)
  }

  /**
   * Handle create new note.
   */
  const handleCreateNote = () => {
    setSelectedNote(undefined)
    setIsModalOpen(true)
  }

  /**
   * Handle pin toggle.
   */
  const handleTogglePin = async (noteId: string) => {
    try {
      const result = await toggleNotePin(noteId)
      if (result.success) {
        setNotes((prev) =>
          sortNotes(prev.map((n) => (n.id === noteId ? result.data : n)))
        )
      }
    } catch (err) {
      console.error('Failed to toggle pin:', err)
    }
  }

  /**
   * Handle note deletion.
   */
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const result = await deleteNote(noteId)
      if (result.success) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId))
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete note.')
    }
  }

  /**
   * Handle modal success.
   */
  const handleModalSuccess = () => {
    fetchNotes()
  }

  // Filter notes
  const filteredNotes = notes.filter((note) => {
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !note.title.toLowerCase().includes(query) &&
        !note.content.toLowerCase().includes(query)
      ) {
        return false
      }
    }

    // Filter by category
    if (categoryFilter !== 'all' && note.category !== categoryFilter) {
      return false
    }

    return true
  })

  // Separate pinned and unpinned
  const pinnedNotes = filteredNotes.filter((n) => n.isPinned)
  const unpinnedNotes = filteredNotes.filter((n) => !n.isPinned)

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Notes</h2>
          <p className="text-sm text-muted-foreground">
            Write and organize your thoughts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotes} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleCreateNote}>
            <Plus className="h-4 w-4 mr-1" />
            New Note
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {NOTE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {NOTE_CATEGORY_ICONS[category]} {NOTE_CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredNotes.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Notes</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'No notes match your search.'
                  : 'Create your first note to get started.'}
              </p>
              <Button onClick={handleCreateNote}>
                <Plus className="h-4 w-4 mr-1" />
                Create Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pinned Notes */}
      {!isLoading && pinnedNotes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Pin className="h-4 w-4" />
            Pinned
          </h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => handleNoteClick(note)}
                onPin={() => handleTogglePin(note.id)}
                onDelete={() => handleDeleteNote(note.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other Notes */}
      {!isLoading && unpinnedNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <h3 className="text-sm font-medium mb-3">All Notes</h3>
          )}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {unpinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => handleNoteClick(note)}
                onPin={() => handleTogglePin(note.id)}
                onDelete={() => handleDeleteNote(note.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Note Modal */}
      <NoteModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        note={selectedNote}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
