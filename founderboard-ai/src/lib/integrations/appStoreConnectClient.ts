/**
 * App Store Connect API Client
 *
 * Handles JWT generation and API calls to App Store Connect.
 * Documentation: https://developer.apple.com/documentation/appstoreconnectapi
 */

import jwt from 'jsonwebtoken'

const API_BASE_URL = 'https://api.appstoreconnect.apple.com/v1'

// ========================================
// TYPES
// ========================================

export interface AppStoreCredentials {
  issuerId: string
  keyId: string
  privateKey: string
}

export interface AppStoreApp {
  id: string
  name: string
  bundleId: string
  sku: string
}

export interface AppStoreReview {
  id: string
  rating: number
  title?: string
  body: string
  reviewerNickname: string
  createdDate: string
  territory: string
}

export interface AppStoreSalesReport {
  appId: string
  units: number
  proceeds: number
  proceedsCurrency: string
}

// ========================================
// JWT GENERATION
// ========================================

/**
 * Generate a JWT token for App Store Connect API authentication.
 * Token is valid for 20 minutes (Apple's max is 20 minutes).
 */
export function generateJWT(credentials: AppStoreCredentials): string {
  const now = Math.floor(Date.now() / 1000)

  const payload = {
    iss: credentials.issuerId,
    iat: now,
    exp: now + 1200, // 20 minutes
    aud: 'appstoreconnect-v1',
  }

  const token = jwt.sign(payload, credentials.privateKey, {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: credentials.keyId,
      typ: 'JWT',
    },
  })

  return token
}

// ========================================
// API CLIENT
// ========================================

export class AppStoreConnectClient {
  private credentials: AppStoreCredentials
  private token: string | null = null
  private tokenExpiry: number = 0

  constructor(credentials: AppStoreCredentials) {
    this.credentials = credentials
  }

  /**
   * Get a valid JWT token, refreshing if necessary.
   */
  private getToken(): string {
    const now = Math.floor(Date.now() / 1000)

    // Refresh token if expired or expiring within 60 seconds
    if (!this.token || this.tokenExpiry <= now + 60) {
      this.token = generateJWT(this.credentials)
      this.tokenExpiry = now + 1200
    }

    return this.token
  }

  /**
   * Make an authenticated API request.
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `App Store Connect API error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return response.json()
  }

  /**
   * List all apps for the account.
   */
  async getApps(): Promise<AppStoreApp[]> {
    interface AppsResponse {
      data: Array<{
        id: string
        attributes: {
          name: string
          bundleId: string
          sku: string
        }
      }>
    }

    const response = await this.request<AppsResponse>('/apps?limit=200')

    return response.data.map((app) => ({
      id: app.id,
      name: app.attributes.name,
      bundleId: app.attributes.bundleId,
      sku: app.attributes.sku,
    }))
  }

  /**
   * Get customer reviews for an app.
   */
  async getCustomerReviews(appId: string, limit = 50): Promise<AppStoreReview[]> {
    interface ReviewsResponse {
      data: Array<{
        id: string
        attributes: {
          rating: number
          title?: string
          body: string
          reviewerNickname: string
          createdDate: string
          territory: string
        }
      }>
    }

    const response = await this.request<ReviewsResponse>(
      `/apps/${appId}/customerReviews?limit=${limit}&sort=-createdDate`
    )

    return response.data.map((review) => ({
      id: review.id,
      rating: review.attributes.rating,
      title: review.attributes.title,
      body: review.attributes.body,
      reviewerNickname: review.attributes.reviewerNickname,
      createdDate: review.attributes.createdDate,
      territory: review.attributes.territory,
    }))
  }

  /**
   * Get app info including ratings summary.
   */
  async getAppInfo(appId: string): Promise<{
    name: string
    bundleId: string
    averageRating: number
    ratingCount: number
  } | null> {
    interface AppResponse {
      data: {
        id: string
        attributes: {
          name: string
          bundleId: string
        }
      }
    }

    try {
      const response = await this.request<AppResponse>(`/apps/${appId}`)

      return {
        name: response.data.attributes.name,
        bundleId: response.data.attributes.bundleId,
        averageRating: 0, // Will be calculated from reviews
        ratingCount: 0,
      }
    } catch {
      return null
    }
  }

  /**
   * Get sales and trends reports.
   * Note: This endpoint returns gzipped TSV data, not JSON.
   * For simplicity, we'll use the Analytics Reports API instead.
   */
  async getSalesReports(
    vendorNumber: string,
    reportDate: string
  ): Promise<AppStoreSalesReport[]> {
    // Sales reports require different handling (gzipped TSV)
    // For now, return empty array - full implementation would need:
    // 1. Call /v1/salesReports with query params
    // 2. Decompress gzip response
    // 3. Parse TSV data

    console.log('Sales reports not fully implemented yet', { vendorNumber, reportDate })
    return []
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Calculate average rating from reviews.
 */
export function calculateAverageRating(reviews: AppStoreReview[]): number {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10
}

/**
 * Group reviews by rating.
 */
export function groupReviewsByRating(
  reviews: AppStoreReview[]
): Record<number, number> {
  const groups: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  for (const review of reviews) {
    if (review.rating >= 1 && review.rating <= 5) {
      groups[review.rating]++
    }
  }

  return groups
}
