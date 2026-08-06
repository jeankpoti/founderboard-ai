'use client'

/**
 * DashboardHeader Component
 *
 * Client component for the dashboard header bar.
 * Contains org name, role badge, info button, user email, and sign out.
 * The info button opens the WelcomeDialog.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/features/auth'
import { WelcomeDialog } from '@/components/features/welcome'

interface DashboardHeaderProps {
  orgName: string
  role?: string
  email?: string | null
  isGuest: boolean
  needsOnboarding: boolean
}

export function DashboardHeader({
  orgName,
  role,
  email,
  isGuest,
  needsOnboarding,
}: DashboardHeaderProps) {
  const [showWelcome, setShowWelcome] = useState(false)

  return (
    <>
      <header className="h-14 border-b flex items-center px-6 justify-between">
        {needsOnboarding ? (
          <p className="text-sm font-medium">Getting Started</p>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{orgName}</p>
            {!isGuest && role && (
              <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded capitalize">
                {role}
              </span>
            )}
            {isGuest && (
              <span className="text-xs text-blue-600 dark:text-blue-400 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                Demo Mode
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Info button - opens welcome dialog */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowWelcome(true)}
            title="About Founderboard AI"
            className="h-8 w-8"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Button>

          {/* Email (hidden on small screens) - only for authenticated users */}
          {!isGuest && email && (
            <p className="text-sm text-muted-foreground hidden sm:block">
              {email}
            </p>
          )}

          {/* Sign out button */}
          {!isGuest && needsOnboarding && <SignOutButton variant="ghost" />}
          {!isGuest && !needsOnboarding && (
            <div className="md:hidden">
              <SignOutButton variant="ghost" />
            </div>
          )}
        </div>
      </header>

      {/* Welcome Dialog - triggered by info button */}
      <WelcomeDialog forceOpen={showWelcome} onOpenChange={setShowWelcome} />
    </>
  )
}
