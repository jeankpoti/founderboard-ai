'use client'

/**
 * ReviewsList Component
 *
 * Displays a list of app reviews with ratings and platform indicators.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { AppReview } from '@/types/integrations'

interface ReviewsListProps {
  reviews: AppReview[]
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [showCount, setShowCount] = useState(5)

  // Filter reviews
  const filteredReviews = filterRating
    ? reviews.filter((r) => r.rating === filterRating)
    : reviews

  // Sort by date (newest first)
  const sortedReviews = [...filteredReviews].sort(
    (a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime()
  )

  // Paginate
  const visibleReviews = sortedReviews.slice(0, showCount)

  // Render star rating
  function renderStars(rating: number): React.ReactNode {
    return (
      <span className="inline-flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? 'text-yellow-500' : 'text-muted-foreground/30'}
          >
            ★
          </span>
        ))}
      </span>
    )
  }

  // Format relative time
  function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  // No reviews
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">💬</div>
        <p className="text-muted-foreground">No reviews yet</p>
        <p className="text-sm text-muted-foreground">
          Reviews will appear here once your app receives feedback.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Rating Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Button
          variant={filterRating === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterRating(null)}
        >
          All ({reviews.length})
        </Button>
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = reviews.filter((r) => r.rating === rating).length
          if (count === 0) return null
          return (
            <Button
              key={rating}
              variant={filterRating === rating ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterRating(rating)}
            >
              {rating}★ ({count})
            </Button>
          )
        })}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {visibleReviews.map((review) => (
          <div
            key={review.id}
            className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Rating and Title */}
                <div className="flex items-center gap-2 flex-wrap">
                  {renderStars(review.rating)}
                  {review.title && (
                    <span className="font-medium truncate">{review.title}</span>
                  )}
                </div>

                {/* Review Body */}
                <p className="text-sm mt-2 text-muted-foreground line-clamp-3">
                  {review.body}
                </p>

                {/* Meta Info */}
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span>{review.authorName}</span>
                  <span>•</span>
                  <span>{formatRelativeTime(review.reviewDate)}</span>
                  {review.appVersion && (
                    <>
                      <span>•</span>
                      <span>v{review.appVersion}</span>
                    </>
                  )}
                </div>

                {/* Developer Response */}
                {review.response && (
                  <div className="mt-3 pl-4 border-l-2 border-primary/30">
                    <p className="text-xs font-medium text-primary">Developer Response:</p>
                    <p className="text-sm text-muted-foreground mt-1">{review.response}</p>
                  </div>
                )}
              </div>

              {/* Platform Badge */}
              <span
                className={`flex-shrink-0 text-lg ${
                  review.platform === 'ios' ? '' : ''
                }`}
                title={review.platform === 'ios' ? 'iOS' : 'Android'}
              >
                {review.platform === 'ios' ? '🍎' : '🤖'}
              </span>
            </div>

            {/* Needs Response Indicator */}
            {!review.response && review.rating <= 3 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Consider responding to this review
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More */}
      {sortedReviews.length > showCount && (
        <div className="text-center pt-4">
          <Button variant="outline" onClick={() => setShowCount(showCount + 5)}>
            Load More Reviews
          </Button>
        </div>
      )}

      {/* No results after filter */}
      {filteredReviews.length === 0 && filterRating !== null && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No {filterRating}-star reviews</p>
        </div>
      )}
    </div>
  )
}
