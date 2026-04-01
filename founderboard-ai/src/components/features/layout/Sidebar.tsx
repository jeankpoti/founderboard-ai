'use client'

/**
 * Sidebar Component
 *
 * A collapsible sidebar navigation component.
 * - Toggle button to collapse/expand
 * - Shows only icons when collapsed
 * - Persists state in localStorage
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { OrgSwitcher } from '@/components/features/organization'
import { SignOutButton } from '@/components/features/auth'
import type { Organization } from '@/types/organization'

// ========================================
// TYPES
// ========================================

interface NavigationItem {
  name: string
  href: string
  icon: string
  section?: string
}

interface SidebarProps {
  currentOrg: Organization
  organizations: Organization[]
  userEmail: string | null
  navigationItems: NavigationItem[]
}

// ========================================
// CONSTANTS
// ========================================

const STORAGE_KEY = 'sidebar-collapsed'

// ========================================
// COMPONENT
// ========================================

export function Sidebar({
  currentOrg,
  organizations,
  userEmail,
  navigationItems,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return localStorage.getItem(STORAGE_KEY) === 'true'
  })
  const pathname = usePathname()

  // Toggle collapsed state and persist to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem(STORAGE_KEY, String(newState))
  }

  const isActiveItem = (href: string) => {
    if (pathname === href) {
      return true
    }

    return pathname.startsWith(`${href}/`)
  }

  return (
    <aside
      className={cn(
        'border-r bg-muted/30 hidden md:flex md:flex-col transition-all duration-300 relative',
        isCollapsed ? 'w-16 p-2' : 'w-64 p-4'
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapsed}
        className={cn(
          'absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-muted z-10',
        )}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Organization Switcher */}
      <div className={cn('mb-6', isCollapsed && 'flex justify-center')}>
        {isCollapsed ? (
          // Show only org initial when collapsed
          <div
            className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-sm font-medium"
            title={currentOrg.name}
          >
            {currentOrg.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <OrgSwitcher currentOrg={currentOrg} organizations={organizations} />
        )}
      </div>

      {/* Navigation Links */}
      <nav className={cn('space-y-1 flex-1', isCollapsed && 'space-y-2')}>
        {navigationItems.map((item, index) => (
          <div key={item.href}>
            {/* Section Header (hidden when collapsed) */}
            {item.section && index > 0 && !isCollapsed && (
              <p className="text-xs font-medium text-muted-foreground px-2 pt-4 pb-2">
                {item.section}
              </p>
            )}

            {/* Navigation Link */}
            <Link
              href={item.href}
              aria-current={isActiveItem(item.href) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 text-sm rounded-md transition-colors',
                isCollapsed ? 'justify-center p-2' : 'px-2 py-1.5',
                isActiveItem(item.href)
                  ? 'bg-primary/10 text-foreground font-medium ring-1 ring-border'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              {/* Icon */}
              <svg
                className={cn(
                  'h-4 w-4 flex-shrink-0',
                  isActiveItem(item.href) ? 'text-foreground' : 'text-current'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={item.icon}
                />
              </svg>
              {/* Label (hidden when collapsed) */}
              {!isCollapsed && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div
        className={cn(
          'pt-4 border-t',
          isCollapsed ? 'space-y-2' : 'space-y-2'
        )}
      >
        {/* Email (hidden when collapsed) */}
        {!isCollapsed && userEmail && (
          <p className="text-xs text-muted-foreground px-2 truncate">
            {userEmail}
          </p>
        )}
        {/* Sign Out Button */}
        {isCollapsed ? (
          <SignOutButton
            variant="outline"
            size="icon"
            className="w-full"
            title="Sign out"
          />
        ) : (
          <SignOutButton variant="outline" className="w-full" />
        )}
      </div>
    </aside>
  )
}
