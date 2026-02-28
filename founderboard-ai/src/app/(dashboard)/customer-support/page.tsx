'use client'

/**
 * Customer Support Page
 *
 * Displays Intercom customer support metrics and conversations.
 */

import { CustomerSupportDashboard } from '@/components/features/customer-support'

export default function CustomerSupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customer Support</h1>
        <p className="text-muted-foreground">
          Monitor support conversations and response times from Intercom.
        </p>
      </div>

      <CustomerSupportDashboard />
    </div>
  )
}
