'use client'

/**
 * TrafficSources Component
 *
 * Displays traffic sources breakdown with progress bars.
 */

import type { GoogleAnalyticsTrafficSource } from '@/types/integrations'

interface TrafficSourcesProps {
  sources: GoogleAnalyticsTrafficSource[]
}

export function TrafficSources({ sources }: TrafficSourcesProps) {
  // No data
  if (sources.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">{"</>"}</div>
        <p className="text-muted-foreground">No traffic sources yet</p>
        <p className="text-sm text-muted-foreground">
          Source breakdown will appear here once data syncs.
        </p>
      </div>
    )
  }

  // Calculate total sessions for percentage
  const totalSessions = sources.reduce((sum, s) => sum + s.sessions, 0)

  // Get color based on source
  function getSourceColor(source: string, medium: string): string {
    const key = `${source}/${medium}`.toLowerCase()

    if (key.includes('google') && key.includes('organic')) return 'bg-green-500'
    if (key.includes('google') && key.includes('cpc')) return 'bg-blue-500'
    if (key.includes('direct')) return 'bg-purple-500'
    if (key.includes('facebook')) return 'bg-blue-600'
    if (key.includes('twitter') || key.includes('x.com')) return 'bg-slate-700'
    if (key.includes('linkedin')) return 'bg-blue-700'
    if (key.includes('instagram')) return 'bg-pink-500'
    if (key.includes('youtube')) return 'bg-red-500'
    if (medium === 'referral') return 'bg-amber-500'
    if (medium === 'email') return 'bg-teal-500'

    return 'bg-slate-400'
  }

  // Format source/medium for display
  function formatSource(source: string, medium: string): string {
    if (source === '(direct)' || source === 'direct') return '(direct)'
    if (medium === '(none)' || medium === 'none') return source
    return `${source} / ${medium}`
  }

  return (
    <div className="space-y-3">
      {sources.slice(0, 10).map((source, index) => {
        const percentage = totalSessions > 0
          ? Math.round((source.sessions / totalSessions) * 100)
          : 0

        return (
          <div key={`${source.source}-${source.medium}-${index}`} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium truncate max-w-[200px]">
                {formatSource(source.source, source.medium)}
              </span>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{source.sessions.toLocaleString()}</span>
                <span className="text-xs">({percentage}%)</span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${getSourceColor(source.source, source.medium)} transition-all`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {source.bounceRate > 0 && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{source.users.toLocaleString()} users</span>
                <span>{source.bounceRate.toFixed(1)}% bounce</span>
                {source.conversionRate > 0 && (
                  <span className="text-green-600">{source.conversionRate.toFixed(1)}% conv.</span>
                )}
              </div>
            )}
          </div>
        )
      })}

      {sources.length > 10 && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          +{sources.length - 10} more sources
        </p>
      )}
    </div>
  )
}
