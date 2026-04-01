'use client'

/**
 * TemplateLibrary Component
 *
 * Main component for viewing and managing templates.
 * Features:
 * - List of all templates with search
 * - Category filtering
 * - Create, edit, duplicate, and delete templates
 * - Use template to generate content
 *
 * WHAT IS A TEMPLATE LIBRARY?
 * A collection of reusable content templates that help
 * users quickly create consistent documents and notes.
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  RefreshCw,
  FileText,
  MoreVertical,
  Copy,
  Pencil,
  Trash2,
  Play,
  Star,
} from 'lucide-react'
import { getTemplates, deleteTemplate, duplicateTemplate } from '@/lib/actions/templates'
import { TemplateModal } from './TemplateModal'
import { UseTemplateModal } from './UseTemplateModal'
import type { Template, TemplateCategory } from '@/types/templates'
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_CATEGORY_ICONS,
  TEMPLATE_CATEGORY_COLORS,
  TEMPLATE_OUTPUT_LABELS,
} from '@/types/templates'

// ========================================
// TEMPLATE CARD
// ========================================

interface TemplateCardProps {
  template: Template
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onUse: () => void
}

/**
 * Individual template card in the library.
 *
 * Shows template info and provides action buttons.
 */
function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  onUse,
}: TemplateCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{TEMPLATE_CATEGORY_ICONS[template.category]}</span>
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                {template.name}
                {template.isSystem && (
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {TEMPLATE_OUTPUT_LABELS[template.outputType]}
              </CardDescription>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onUse}>
                <Play className="h-4 w-4 mr-2" />
                Use Template
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!template.isSystem && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              {!template.isSystem && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {/* Description */}
        {template.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant="secondary" className={TEMPLATE_CATEGORY_COLORS[template.category]}>
            {TEMPLATE_CATEGORY_LABELS[template.category]}
          </Badge>
          <div className="flex items-center gap-3">
            <span>{template.usageCount} uses</span>
            <span>{formatDate(template.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ========================================
// MAIN COMPONENT
// ========================================

export function TemplateLibrary() {
  // State
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Modals
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isUseModalOpen, setIsUseModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | undefined>()

  /**
   * Fetch templates from the server.
   */
  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getTemplates()
      if (result.success) {
        setTemplates(result.data)
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err)
      setError('Failed to load templates.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  /**
   * Handle creating a new template.
   */
  const handleCreate = () => {
    setSelectedTemplate(undefined)
    setIsTemplateModalOpen(true)
  }

  /**
   * Handle editing a template.
   */
  const handleEdit = (template: Template) => {
    setSelectedTemplate(template)
    setIsTemplateModalOpen(true)
  }

  /**
   * Handle duplicating a template.
   */
  const handleDuplicate = async (template: Template) => {
    try {
      const result = await duplicateTemplate(template.id)
      if (result.success) {
        setTemplates((prev) => [...prev, result.data])
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      console.error('Failed to duplicate template:', err)
      setError('Failed to duplicate template.')
    }
  }

  /**
   * Handle deleting a template.
   */
  const handleDelete = async (template: Template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return

    try {
      const result = await deleteTemplate(template.id)
      if (result.success) {
        setTemplates((prev) => prev.filter((t) => t.id !== template.id))
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      console.error('Failed to delete template:', err)
      setError('Failed to delete template.')
    }
  }

  /**
   * Handle using a template.
   */
  const handleUse = (template: Template) => {
    setSelectedTemplate(template)
    setIsUseModalOpen(true)
  }

  /**
   * Handle template modal success.
   */
  const handleTemplateModalSuccess = () => {
    fetchTemplates()
  }

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = template.name.toLowerCase().includes(query)
      const matchesDescription = template.description.toLowerCase().includes(query)
      const matchesTags = template.tags.some((tag) => tag.toLowerCase().includes(query))
      if (!matchesName && !matchesDescription && !matchesTags) {
        return false
      }
    }

    // Category filter
    if (categoryFilter !== 'all' && template.category !== categoryFilter) {
      return false
    }

    return true
  })

  // Group templates by system vs custom
  const systemTemplates = filteredTemplates.filter((t) => t.isSystem)
  const customTemplates = filteredTemplates.filter((t) => !t.isSystem)

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Template Library</h2>
          <p className="text-sm text-muted-foreground">
            Reusable templates for notes, documents, and more
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTemplates} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Template
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
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TEMPLATE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {TEMPLATE_CATEGORY_ICONS[category]} {TEMPLATE_CATEGORY_LABELS[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Templates</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'No templates match your search.'
                  : 'Create your first template to get started.'}
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-1" />
                Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Templates */}
      {!isLoading && systemTemplates.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            System Templates
          </h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {systemTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => handleEdit(template)}
                onDuplicate={() => handleDuplicate(template)}
                onDelete={() => handleDelete(template)}
                onUse={() => handleUse(template)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom Templates */}
      {!isLoading && customTemplates.length > 0 && (
        <div>
          {systemTemplates.length > 0 && (
            <h3 className="text-sm font-medium mb-3">Custom Templates</h3>
          )}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {customTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => handleEdit(template)}
                onDuplicate={() => handleDuplicate(template)}
                onDelete={() => handleDelete(template)}
                onUse={() => handleUse(template)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Template Edit Modal */}
      <TemplateModal
        open={isTemplateModalOpen}
        onOpenChange={setIsTemplateModalOpen}
        template={selectedTemplate}
        onSuccess={handleTemplateModalSuccess}
      />

      {/* Use Template Modal */}
      {selectedTemplate && (
        <UseTemplateModal
          open={isUseModalOpen}
          onOpenChange={setIsUseModalOpen}
          template={selectedTemplate}
        />
      )}
    </div>
  )
}
