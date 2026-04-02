'use client'

/**
 * RatingDistribution Component
 *
 * Shows a bar chart of rating distribution (1-5 stars).
 */

import type { AppReview } from '@/types/integrations'
import { groupReviewsByRating } from '@/types/integrations'

interface RatingDistributionProps {
  reviews: AppReview[]
}

export function RatingDistribution({ reviews }: RatingDistributionProps) {
  const distribution = groupReviewsByRating(reviews)
  const total = reviews.length

  // Get max count for scaling bars
  const maxCount = Math.max(...Object.values(distribution), 1)

  // Rating labels and colors
  const ratingConfig: Record<number, { label: string; color: string }> = {
    5: { label: 'Excellent', color: 'bg-green-500' },
    4: { label: 'Good', color: 'bg-lime-500' },
    3: { label: 'Average', color: 'bg-yellow-500' },
    2: { label: 'Poor', color: 'bg-orange-500' },
    1: { label: 'Terrible', color: 'bg-red-500' },
  }

  // No reviews
  if (total === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-muted-foreground">No rating data available</p>
        <p className="text-sm text-muted-foreground">
          Rating distribution will appear once you have reviews.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = distribution[rating]
        const percentage = total > 0 ? (count / total) * 100 : 0
        const barWidth = (count / maxCount) * 100

        return (
          <div key={rating} className="flex items-center gap-3">
            {/* Star Rating */}
            <div className="w-12 flex items-center gap-1 text-sm">
              <span>{rating}</span>
              <span className="text-yellow-500">★</span>
            </div>

            {/* Bar */}
            <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${ratingConfig[rating].color} transition-all duration-500 ease-out rounded-full`}
                style={{ width: `${barWidth}%` }}
              />
            </div>

            {/* Count and Percentage */}
            <div className="w-20 text-right text-sm text-muted-foreground">
              {count} ({percentage.toFixed(0)}%)
            </div>
          </div>
        )
      })}

      {/* Summary */}
      <div className="pt-4 border-t mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total Reviews</span>
          <span className="font-medium">{total}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-muted-foreground">Positive (4-5★)</span>
          <span className="font-medium text-green-600 dark:text-green-400">
            {distribution[4] + distribution[5]} ({(((distribution[4] + distribution[5]) / total) * 100).toFixed(0)}%)
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-muted-foreground">Negative (1-2★)</span>
          <span className="font-medium text-red-600 dark:text-red-400">
            {distribution[1] + distribution[2]} ({(((distribution[1] + distribution[2]) / total) * 100).toFixed(0)}%)
          </span>
        </div>
      </div>
    </div>
  )
}
