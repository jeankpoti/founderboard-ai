'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { type TemplateType, getTemplate } from '@/types/ai'
import { cn } from '@/lib/utils'
import {
  createConversation,
  saveMessage,
  getConversationMessages,
} from '@/lib/actions/ai'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AIChatProps {
  template: TemplateType
  conversationId?: string | null
  onConversationCreated?: (id: string) => void
}

export function AIChat({ template, conversationId, onConversationCreated }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    conversationId ?? null
  )
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const templateConfig = getTemplate(template)

  // Load existing conversation messages
  useEffect(() => {
    async function loadMessages() {
      if (!conversationId) {
        setMessages([])
        setCurrentConversationId(null)
        return
      }

      setIsLoadingHistory(true)
      try {
        const result = await getConversationMessages(conversationId)
        if (result.success) {
          setMessages(
            result.data.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
            }))
          )
          setCurrentConversationId(conversationId)
        } else {
          toast.error(result.error.message)
        }
      } catch (error) {
        console.error('Load messages error:', error)
        toast.error('Failed to load conversation')
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadMessages()
  }, [conversationId])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Get placeholder text based on template
  const getPlaceholder = () => {
    switch (template) {
      case 'investor-update':
        return 'Tell me about your key wins, challenges, and what you need help with...'
      case 'pitch-deck':
        return 'Describe your startup, target market, and what makes you unique...'
      case 'social-post':
        return 'What would you like to share? (product launch, milestone, insight...)'
      default:
        return 'What would you like help with?'
    }
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessageContent = input.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    abortControllerRef.current = new AbortController()

    try {
      // Create conversation if this is the first message
      let convId = currentConversationId
      if (!convId) {
        const convResult = await createConversation(template)
        if (!convResult.success) {
          throw new Error(convResult.error.message)
        }
        convId = convResult.data.id
        setCurrentConversationId(convId)
        onConversationCreated?.(convId)
      }

      // Save user message
      await saveMessage(convId, 'user', userMessageContent)

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessageContent, template }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate content')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      }

      setMessages((prev) => [...prev, assistantMessage])

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullContent += chunk
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === prev.length - 1 && msg.role === 'assistant'
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        )
      }

      // Save assistant message after streaming completes
      if (convId && fullContent) {
        await saveMessage(convId, 'assistant', fullContent)
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled
        return
      }
      console.error('Chat error:', error)
      toast.error((error as Error).message || 'Failed to generate content')
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [input, isLoading, template, currentConversationId, onConversationCreated])

  const handleStop = () => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }

  const handleRegenerate = async () => {
    if (messages.length < 2) return

    // Get the last user message
    const lastUserMessageIndex = messages.findLastIndex((m) => m.role === 'user')
    if (lastUserMessageIndex === -1) return

    const lastUserMessage = messages[lastUserMessageIndex]

    // Remove the last assistant message
    setMessages((prev) => prev.slice(0, -1))

    // Regenerate
    setInput(lastUserMessage.content)
    // Need to trigger submission after state update
    setTimeout(() => {
      const form = document.querySelector('form')
      form?.dispatchEvent(new Event('submit', { bubbles: true }))
    }, 0)
  }

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-full">
        <div className="pb-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{templateConfig.icon}</span>
            <div>
              <h2 className="font-semibold">{templateConfig.name}</h2>
              <p className="text-sm text-muted-foreground">{templateConfig.description}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-2 w-full max-w-md">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="pb-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{templateConfig.icon}</span>
          <div>
            <h2 className="font-semibold">{templateConfig.name}</h2>
            <p className="text-sm text-muted-foreground">{templateConfig.description}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Start a conversation to generate content.</p>
            <p className="text-xs mt-1">Your metrics will be included automatically.</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <Card
              className={cn(
                'max-w-[85%] p-4',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {message.role === 'assistant' ? (
                  message.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <span>...</span>
                  )
                ) : (
                  <p>{message.content}</p>
                )}
              </div>

              {message.role === 'assistant' && message.content && !isLoading && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleCopy(message.content, message.id)}
                  >
                    {copiedId === message.id ? (
                      <>
                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied
                      </>
                    ) : (
                      <>
                        <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleRegenerate}
                    disabled={isLoading}
                  >
                    <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </Button>
                </div>
              )}
            </Card>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <Card className="max-w-[85%] p-4 bg-muted">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={getPlaceholder()}
            className="flex-1 min-h-[80px] max-h-[200px] p-3 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e as unknown as React.FormEvent)
              }
            }}
          />
          <div className="flex flex-col gap-2">
            {isLoading ? (
              <Button type="button" variant="destructive" onClick={handleStop}>
                Stop
              </Button>
            ) : (
              <Button type="submit" disabled={!input.trim()}>
                Send
              </Button>
            )}
          </div>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
