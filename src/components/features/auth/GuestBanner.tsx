'use client'

/**
 * GuestBanner Component
 *
 * Displayed at the top of the dashboard for unauthenticated users.
 * Prompts them to sign up to save their data.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function GuestBanner() {
  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
      <div className="px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">👋</span>
          <p className="text-sm">
            <span className="text-muted-foreground">You&apos;re viewing a demo.</span>{' '}
            <span className="font-medium">Sign up free</span>{' '}
            <span className="text-muted-foreground">to track your own startup metrics.</span>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">Sign up free</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
