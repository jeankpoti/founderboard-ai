'use client'

/**
 * WelcomeDialog Component
 *
 * Shows a welcome message explaining what Founderboard AI is.
 * Automatically appears on first visit (tracked via localStorage).
 * Can be manually triggered via the info icon in the header.
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'founderboard-welcome-seen'

interface WelcomeDialogProps {
  forceOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function WelcomeDialog({ forceOpen, onOpenChange }: WelcomeDialogProps) {
  const [open, setOpen] = useState(false)

  // Check localStorage on mount to see if user has seen welcome
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem(STORAGE_KEY)
    if (!hasSeenWelcome && forceOpen === undefined) {
      setOpen(true)
    }
  }, [forceOpen])

  // Handle forceOpen prop changes (for manual trigger via info icon)
  useEffect(() => {
    if (forceOpen !== undefined) {
      setOpen(forceOpen)
    }
  }, [forceOpen])

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setOpen(false)
    onOpenChange?.(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose()
        else setOpen(true)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Founderboard AI</DialogTitle>
          <DialogDescription>
            The AI-powered dashboard for startup founders
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Founderboard AI helps you track all your startup metrics in one place:
          </p>
          <ul className="text-sm space-y-2">
            <li>
              <strong>Metrics Dashboard</strong> - Track KPIs from all your tools
            </li>
            <li>
              <strong>AI Studio</strong> - Generate content and insights
            </li>
            <li>
              <strong>App Analytics</strong> - iOS & Android metrics
            </li>
            <li>
              <strong>Revenue</strong> - Stripe integration
            </li>
            <li>
              <strong>Dev Insights</strong> - GitHub & Linear data
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            You&apos;re currently viewing demo data. Sign up free to connect your own tools.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={handleClose}>Get Started</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
