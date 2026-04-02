'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { switchOrganization } from '@/lib/actions/organization'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import type { Organization } from '@/types/organization'

interface OrgSwitcherProps {
  currentOrg: Organization
  organizations: Organization[]
}

export function OrgSwitcher({ currentOrg, organizations }: OrgSwitcherProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSwitch(orgId: string) {
    if (orgId === currentOrg.id) return

    setIsLoading(true)
    try {
      const result = await switchOrganization(orgId)

      if (!result.success) {
        toast.error(result.error.message)
        return
      }

      toast.success('Switched organization')
      router.refresh()
    } catch (error) {
      console.error('Switch org error:', error)
      toast.error('Failed to switch organization')
    } finally {
      setIsLoading(false)
    }
  }

  // If only one org, just show the name without dropdown
  if (organizations.length <= 1) {
    return (
      <div className="px-2 py-1.5">
        <p className="text-sm font-medium truncate">{currentOrg.name}</p>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-2"
          disabled={isLoading}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-medium">
            {currentOrg.name.charAt(0).toUpperCase()}
          </div>
          <span className="truncate flex-1 text-left">{currentOrg.name}</span>
          <svg
            className="h-4 w-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitch(org.id)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2 w-full">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-medium">
                {org.name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate flex-1">{org.name}</span>
              {org.id === currentOrg.id && (
                <svg
                  className="h-4 w-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
