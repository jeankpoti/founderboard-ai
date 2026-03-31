'use client'

/**
 * DocumentLibrary Component
 *
 * The main component for viewing and managing documents.
 * Shows a grid of documents with folder organization.
 *
 * FEATURES:
 * - Grid/List view toggle
 * - Folder navigation
 * - Document type filtering
 * - Upload button
 */

import { useState, useEffect, useCallback, useRef } from 'react'
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
  Upload,
  Folder,
  Grid,
  List,
  Search,
  RefreshCw,
  File,
  Eye,
  Download,
  Trash2,
  MoreVertical,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getDocuments, getFolders, deleteDocument } from '@/lib/actions/documents'
import type { Document, DocumentFolder } from '@/types/documents'
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  formatFileSize,
  getFileIcon,
} from '@/types/documents'

// ========================================
// DOCUMENT CARD
// ========================================

interface DocumentCardProps {
  document: Document
  viewMode: 'grid' | 'list'
  isDownloading: boolean
  onView: () => void
  onDownload: () => void
  onDelete: () => void
}

function DocumentCard({
  document,
  viewMode,
  isDownloading,
  onView,
  onDownload,
  onDelete,
}: DocumentCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (viewMode === 'list') {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-2xl">{getFileIcon(document.fileExtension)}</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{document.name}</p>
            <p className="text-xs text-muted-foreground">
              {DOCUMENT_TYPE_LABELS[document.type]} • {formatFileSize(document.fileSize)} •{' '}
              {formatDate(document.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onView} title="View document">
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDownload} disabled={isDownloading}>
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{getFileIcon(document.fileExtension)}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDownload} disabled={isDownloading}>
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <h3 className="font-medium text-sm truncate mb-1" title={document.name}>
          {document.name}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">
            {DOCUMENT_TYPE_LABELS[document.type]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(document.fileSize)} • {formatDate(document.createdAt)}
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onDownload}
            disabled={isDownloading}
          >
            <Download className="h-4 w-4 mr-1" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function getDocumentAccessUrl(documentId: string, disposition: 'attachment' | 'inline' = 'attachment') {
  return `/api/documents/${documentId}/download?disposition=${disposition}`
}

// ========================================
// FOLDER CARD
// ========================================

interface FolderCardProps {
  folder: DocumentFolder
  documentCount: number
  onClick: () => void
}

function FolderCard({ folder, documentCount, onClick }: FolderCardProps) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-md"
            style={{ backgroundColor: folder.color || '#e2e8f0' }}
          >
            <Folder className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{folder.name}</h3>
            <p className="text-xs text-muted-foreground">
              {documentCount} document{documentCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ========================================
// MAIN COMPONENT
// ========================================

export function DocumentLibrary() {
  // State
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDownloadingId, setIsDownloadingId] = useState<string | null>(null)

  // View options
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Fetch documents and folders.
   */
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [docsResult, foldersResult] = await Promise.all([
        getDocuments(),
        getFolders(),
      ])

      if (docsResult.success) {
        setDocuments(docsResult.data)
      }
      if (foldersResult.success) {
        setFolders(foldersResult.data)
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err)
      setError('Failed to load documents.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /**
   * Handle file upload.
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const file = files[0]

      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', file)
      if (currentFolderId) {
        formData.append('folderId', currentFolderId)
      }

      // Upload to our API route
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        // Refresh document list
        fetchData()
      } else {
        setError(result.error?.message || 'Upload failed')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload file.')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  /**
   * Handle document deletion.
   */
  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      const result = await deleteDocument(documentId)
      if (result.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== documentId))
      } else {
        setError(result.error.message)
      }
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete document.')
    }
  }

  const isPreviewableImage = (document: Document) => {
    return document.mimeType.startsWith('image/')
  }

  const handleViewDocument = (document: Document) => {
    if (isPreviewableImage(document)) {
      setSelectedDocument(document)
      setIsPreviewOpen(true)
      return
    }

    handleOpenDocumentInNewTab(document)
  }

  const handleOpenDocumentInNewTab = (document: Document) => {
    window.open(getDocumentAccessUrl(document.id, 'inline'), '_blank', 'noopener,noreferrer')
  }

  const handleDownloadDocument = (document: Document) => {
    setIsDownloadingId(document.id)
    setError(null)

    const link = window.document.createElement('a')
    link.href = getDocumentAccessUrl(document.id, 'attachment')
    link.download = document.name
    window.document.body.appendChild(link)
    link.click()
    link.remove()

    window.setTimeout(() => {
      setIsDownloadingId((currentId) => (currentId === document.id ? null : currentId))
    }, 1000)
  }

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    // Filter by folder
    if (currentFolderId) {
      if (doc.folderId !== currentFolderId) return false
    } else {
      if (doc.folderId) return false // Show only root-level docs when no folder selected
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!doc.name.toLowerCase().includes(query)) return false
    }

    // Filter by type
    if (typeFilter !== 'all' && doc.type !== typeFilter) return false

    return true
  })

  // Count documents per folder
  const folderDocCounts = folders.reduce(
    (acc, folder) => {
      acc[folder.id] = documents.filter((d) => d.folderId === folder.id).length
      return acc
    },
    {} as Record<string, number>
  )

  // Current folder for breadcrumb
  const currentFolder = currentFolderId
    ? folders.find((f) => f.id === currentFolderId)
    : null

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Document Library</h2>
          <p className="text-sm text-muted-foreground">
            Store and organize your important files
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-1" />
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Breadcrumb */}
      {currentFolder && (
        <div className="flex items-center gap-2 text-sm">
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setCurrentFolderId(null)}
          >
            All Documents
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{currentFolder.name}</span>
        </div>
      )}

      {/* Filters & View Toggle */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {DOCUMENT_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-r-none"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-l-none"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      {/* Folders (only at root level) */}
      {!isLoading && !currentFolderId && folders.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Folders</h3>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                documentCount={folderDocCounts[folder.id] || 0}
                onClick={() => setCurrentFolderId(folder.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {!isLoading && (
        <div>
          <h3 className="text-sm font-medium mb-3">
            {currentFolder ? `Documents in ${currentFolder.name}` : 'Documents'}
          </h3>

          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Documents</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? 'No documents match your search.'
                      : 'Upload your first document to get started.'}
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" />
                    Upload Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  viewMode={viewMode}
                  isDownloading={isDownloadingId === doc.id}
                  onView={() => handleViewDocument(doc)}
                  onDownload={() => handleDownloadDocument(doc)}
                  onDelete={() => handleDeleteDocument(doc.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  viewMode={viewMode}
                  isDownloading={isDownloadingId === doc.id}
                  onView={() => handleViewDocument(doc)}
                  onDownload={() => handleDownloadDocument(doc)}
                  onDelete={() => handleDeleteDocument(doc.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle>{selectedDocument?.name || 'Preview'}</DialogTitle>
            <DialogDescription>
              Previewing {selectedDocument?.type === 'image' ? 'image' : 'document'}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            {selectedDocument && isPreviewableImage(selectedDocument) ? (
              <div className="mt-4 overflow-hidden rounded-lg border bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getDocumentAccessUrl(selectedDocument.id, 'inline')}
                  alt={selectedDocument.name}
                  className="max-h-[70vh] w-full object-contain"
                />
              </div>
            ) : (
              <div className="py-8 text-sm text-muted-foreground">
                Preview is available for images. Other files open in a new tab.
              </div>
            )}
            {selectedDocument && (
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => handleOpenDocumentInNewTab(selectedDocument)}>
                  <Eye className="h-4 w-4 mr-1" />
                  Open in New Tab
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadDocument(selectedDocument)}
                  disabled={isDownloadingId === selectedDocument.id}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {isDownloadingId === selectedDocument.id ? 'Downloading...' : 'Download'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
