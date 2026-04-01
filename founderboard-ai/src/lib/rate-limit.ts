import { Redis } from '@upstash/redis'
import { AI_RATE_LIMIT_PER_MINUTE, AI_RATE_LIMIT_PER_DAY } from './constants'

// Initialize Redis client (will fail gracefully if not configured)
let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn('Upstash Redis not configured, rate limiting disabled')
    return null
  }

  redis = new Redis({ url, token })
  return redis
}

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  error?: string
}

/**
 * Check rate limit for AI requests
 * Returns success: false if rate limited
 */
export async function checkAIRateLimit(
  userId: string,
  orgId: string
): Promise<RateLimitResult> {
  const client = getRedis()

  // If Redis not configured, allow all requests (development mode)
  if (!client) {
    return { success: true, remaining: 999, reset: 0 }
  }

  try {
    const now = Date.now()
    const minuteKey = `ratelimit:ai:minute:${userId}`
    const dayKey = `ratelimit:ai:day:${orgId}:${new Date().toISOString().split('T')[0]}`

    // Check per-minute limit (user-level)
    const minuteCount = await client.incr(minuteKey)
    if (minuteCount === 1) {
      await client.expire(minuteKey, 60)
    }

    if (minuteCount > AI_RATE_LIMIT_PER_MINUTE) {
      const ttl = await client.ttl(minuteKey)
      return {
        success: false,
        remaining: 0,
        reset: now + (ttl * 1000),
        error: 'Rate limit exceeded. Please wait a minute.',
      }
    }

    // Check per-day limit (org-level)
    const dayCount = await client.incr(dayKey)
    if (dayCount === 1) {
      await client.expire(dayKey, 86400) // 24 hours
    }

    if (dayCount > AI_RATE_LIMIT_PER_DAY) {
      return {
        success: false,
        remaining: 0,
        reset: now + 86400000,
        error: 'Daily limit reached. Try again tomorrow.',
      }
    }

    return {
      success: true,
      remaining: Math.min(
        AI_RATE_LIMIT_PER_MINUTE - minuteCount,
        AI_RATE_LIMIT_PER_DAY - dayCount
      ),
      reset: now + 60000,
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // On error, allow the request (fail open)
    return { success: true, remaining: 999, reset: 0 }
  }
}
