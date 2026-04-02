'use client'

/**
 * ConversationsList Component
 *
 * Displays a list of Intercom conversations.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { IntercomConversation } from '@/types/integrations'

interface ConversationsListProps {
  conversations: IntercomConversation[]
  compact?: boolean
}

const statusConfig = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' },
}

export function ConversationsList({ conversations, compact = false }: ConversationsListProps) {
  const [showCount, setShowCount] = useState(compact ? conversations.length : 20)

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">{"[x]"}</div>
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground">
          Conversations will appear here once synced from Intercom.
        </p>
      </div>
    )
  }

  const visibleConversations = conversations.slice(0, showCount)

  return (
    <div className="space-y-2">
      {visibleConversations.map((conversation) => {
        const status = statusConfig[conversation.status]

        return (
          <div
            key={conversation.id}
            className={`flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors ${
              compact ? 'p-2' : ''
            }`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              {conversation.customerName.charAt(0).toUpperCase()}
            </div>

            {/* Conversation Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`font-medium truncate ${compact ? 'text-sm' : ''}`}>
                  {conversation.subject || 'No subject'}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {conversation.customerName}
                {conversation.assigneeName && (
                  <span className="ml-2">→ {conversation.assigneeName}</span>
                )}
              </p>
              {!compact && (
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span>{conversation.messageCount} messages</span>
                  {conversation.firstResponseTime && (
                    <span>First response: {formatTime(conversation.firstResponseTime)}</span>
                  )}
                  {conversation.rating && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {conversation.rating}/5
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Timestamp */}
            <div className="flex-shrink-0 text-right text-xs text-muted-foreground">
              {formatDate(conversation.updatedAt)}
            </div>
          </div>
        )
      })}

      {!compact && conversations.length > showCount && (
        <div className="text-center pt-2">
          <Button variant="outline" onClick={() => setShowCount(showCount + 20)}>
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`
  }
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours < 24) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  const days = Math.floor(hours / 24)
  return `${days}d`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
}
