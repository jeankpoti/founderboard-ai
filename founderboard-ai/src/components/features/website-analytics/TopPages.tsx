'use client'

/**
 * TopPages Component
 *
 * Displays list of top pages by pageviews.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { GoogleAnalyticsPageView } from '@/types/integrations'
import { formatSessionDuration } from '@/types/integrations'

interface TopPagesProps {
  pages: GoogleAnalyticsPageView[]
}

export function TopPages({ pages }: TopPagesProps) {
  const [showCount, setShowCount] = useState(10)

  // No data
  if (pages.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">{"</>"}</div>
        <p className="text-muted-foreground">No page data yet</p>
        <p className="text-sm text-muted-foreground">
          Top pages will appear here once data syncs.
        </p>
      </div>
    )
  }

  const visiblePages = pages.slice(0, showCount)

  // Calculate total pageviews for percentage
  const totalPageviews = pages.reduce((sum, p) => sum + p.pageviews, 0)

  return (
    <div className="space-y-2">
      {visiblePages.map((page, index) => {
        const percentage = totalPageviews > 0
          ? ((page.pageviews / totalPageviews) * 100).toFixed(1)
          : '0'

        return (
          <div
            key={`${page.pagePath}-${index}`}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {index + 1}
            </div>

            {/* Page Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" title={page.pagePath}>
                {page.pagePath}
              </p>
              {page.pageTitle && page.pageTitle !== page.pagePath && (
                <p className="text-xs text-muted-foreground truncate" title={page.pageTitle}>
                  {page.pageTitle}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>
                  Avg. time: {formatSessionDuration(Math.round(page.avgTimeOnPage))}
                </span>
                {page.bounceRate > 0 && (
                  <span>{page.bounceRate.toFixed(0)}% bounce</span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex-shrink-0 text-right">
              <p className="font-medium text-sm">{page.pageviews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{percentage}%</p>
            </div>
          </div>
        )
      })}

      {/* Load more */}
      {pages.length > showCount && (
        <div className="text-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCount(showCount + 10)}
          >
            Show More
          </Button>
        </div>
      )}
    </div>
  )
}
