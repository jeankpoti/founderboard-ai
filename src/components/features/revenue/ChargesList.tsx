'use client'

/**
 * ChargesList Component
 *
 * Displays a list of recent Stripe charges/payments.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { StripeCharge } from '@/types/integrations'
import {
  formatRevenue,
  STRIPE_CHARGE_STATUS_LABELS,
  STRIPE_CHARGE_STATUS_COLORS,
} from '@/types/integrations'

interface ChargesListProps {
  charges: StripeCharge[]
}

export function ChargesList({ charges }: ChargesListProps) {
  const [filter, setFilter] = useState<StripeCharge['status'] | 'all'>('all')
  const [showCount, setShowCount] = useState(10)

  // Filter charges
  const filteredCharges = filter === 'all'
    ? charges
    : charges.filter((c) => c.status === filter)

  // Paginate
  const visibleCharges = filteredCharges.slice(0, showCount)

  // Format relative time
  function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Status icon
  function StatusIcon({ status }: { status: StripeCharge['status'] }) {
    switch (status) {
      case 'succeeded':
        return (
          <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'pending':
        return (
          <svg className="h-4 w-4 text-yellow-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'failed':
        return (
          <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'refunded':
        return (
          <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        )
    }
  }

  // No charges
  if (charges.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">💸</div>
        <p className="text-muted-foreground">No charges yet</p>
        <p className="text-sm text-muted-foreground">
          Recent payments will appear here once processed.
        </p>
      </div>
    )
  }

  // Get counts for filter buttons
  const statusCounts = {
    all: charges.length,
    succeeded: charges.filter((c) => c.status === 'succeeded').length,
    pending: charges.filter((c) => c.status === 'pending').length,
    failed: charges.filter((c) => c.status === 'failed').length,
    refunded: charges.filter((c) => c.status === 'refunded').length,
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({statusCounts.all})
        </Button>
        {(['succeeded', 'pending', 'failed', 'refunded'] as const).map((status) => {
          if (statusCounts[status] === 0) return null
          return (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {STRIPE_CHARGE_STATUS_LABELS[status]} ({statusCounts[status]})
            </Button>
          )
        })}
      </div>

      {/* Charges list */}
      <div className="space-y-2">
        {visibleCharges.map((charge) => (
          <div
            key={charge.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Status icon */}
              <div className="flex-shrink-0">
                <StatusIcon status={charge.status} />
              </div>

              {/* Amount */}
              <div className="font-medium min-w-[80px]">
                {formatRevenue(charge.amount, charge.currency)}
              </div>

              {/* Customer/Description */}
              <div className="hidden sm:block">
                {charge.customerEmail && (
                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {charge.customerEmail}
                  </p>
                )}
                {charge.description && !charge.customerEmail && (
                  <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {charge.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status badge */}
              <span className={`text-xs px-2 py-1 rounded-full ${STRIPE_CHARGE_STATUS_COLORS[charge.status]}`}>
                {STRIPE_CHARGE_STATUS_LABELS[charge.status]}
              </span>

              {/* Time */}
              <span className="text-xs text-muted-foreground min-w-[60px] text-right">
                {formatRelativeTime(charge.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Load more */}
      {filteredCharges.length > showCount && (
        <div className="text-center pt-2">
          <Button variant="outline" onClick={() => setShowCount(showCount + 10)}>
            Load More
          </Button>
        </div>
      )}

      {/* No results after filter */}
      {filteredCharges.length === 0 && filter !== 'all' && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No {STRIPE_CHARGE_STATUS_LABELS[filter as StripeCharge['status']].toLowerCase()} charges</p>
        </div>
      )}
    </div>
  )
}
