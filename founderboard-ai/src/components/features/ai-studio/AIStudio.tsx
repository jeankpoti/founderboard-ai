'use client'

import { useState, useEffect, useCallback } from 'react'
import { AIChat } from './AIChat'
import { type TemplateType, type AIConversation, getTemplate, TEMPLATES } from '@/types/ai'
import { getConversations, deleteConversation } from '@/lib/actions/ai'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function AIStudio() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('investor-update')
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Load conversations on mount
  useEffect(() => {
    async function loadConversations() {
      setIsLoadingConversations(true)
      try {
        const result = await getConversations()
        if (result.success) {
          setConversations(result.data)
        }
      } catch (error) {
        console.error('Failed to load conversations:', error)
      } finally {
        setIsLoadingConversations(false)
      }
    }

    loadConversations()
  }, [])

  const handleNewChat = () => {
    setSelectedConversationId(null)
  }

  const handleSelectConversation = (conversation: AIConversation) => {
    setSelectedConversationId(conversation.id)
    setSelectedTemplate(conversation.template)
  }

  const handleConversationCreated = useCallback((id: string) => {
    setSelectedConversationId(id)
    getConversations().then((result) => {
      if (result.success) {
        setConversations(result.data)
      }
    })
  }, [])

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation()

    try {
      const result = await deleteConversation(conversationId)
      if (result.success) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId))
        if (selectedConversationId === conversationId) {
          setSelectedConversationId(null)
        }
        toast.success('Conversation deleted')
      } else {
        toast.error(result.error.message)
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete conversation')
    }
  }

  const handleSelectTemplate = (template: TemplateType) => {
    setSelectedTemplate(template)
    setSelectedConversationId(null)
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      {/* Sidebar */}
      <div
        className={cn(
          'flex-shrink-0 flex flex-col transition-all duration-200',
          isSidebarOpen ? 'w-72' : 'w-14'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-9 w-9 flex-shrink-0"
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg
              className={cn('h-4 w-4 transition-transform', !isSidebarOpen && 'rotate-180')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </Button>

          {isSidebarOpen && (
            <Button
              onClick={handleNewChat}
              className="flex-1"
              variant={selectedConversationId === null ? 'default' : 'outline'}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </Button>
          )}
        </div>

        {/* Collapsed View - Quick Template Icons */}
        {!isSidebarOpen && (
          <div className="flex flex-col gap-2 items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              className="h-10 w-10"
              title="New Chat"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
            <div className="w-8 h-px bg-border my-2" />
            {TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant={selectedTemplate === template.id ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => handleSelectTemplate(template.id)}
                className="h-10 w-10 text-lg"
                title={template.name}
              >
                {template.icon}
              </Button>
            ))}
          </div>
        )}

        {/* Expanded View - Tabs */}
        {isSidebarOpen && (
          <Tabs defaultValue="templates" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-full">
              <TabsTrigger value="templates" className="flex-1">
                Templates
              </TabsTrigger>
              <TabsTrigger value="history" className="flex-1">
                History
              </TabsTrigger>
            </TabsList>

            {/* Templates Tab */}
            <TabsContent value="templates" className="flex-1 overflow-y-auto mt-4">
              <div className="space-y-2">
                {TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      'p-3 cursor-pointer transition-colors hover:bg-muted/50',
                      selectedTemplate === template.id &&
                        !selectedConversationId &&
                        'border-primary bg-primary/5'
                    )}
                    onClick={() => handleSelectTemplate(template.id)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{template.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="flex-1 overflow-y-auto mt-4">
              {isLoadingConversations ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Start a new chat to begin</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => {
                    const template = getTemplate(conversation.template)
                    return (
                      <Card
                        key={conversation.id}
                        className={cn(
                          'p-3 cursor-pointer hover:bg-accent transition-colors group',
                          selectedConversationId === conversation.id && 'bg-accent border-primary'
                        )}
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg flex-shrink-0">{template.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{conversation.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(conversation.updatedAt)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDeleteConversation(e, conversation.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                            title="Delete conversation"
                          >
                            <svg
                              className="h-4 w-4 text-destructive"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0">
        <AIChat
          key={selectedConversationId ?? `new-${selectedTemplate}`}
          template={selectedTemplate}
          conversationId={selectedConversationId}
          onConversationCreated={handleConversationCreated}
        />
      </div>
    </div>
  )
}
