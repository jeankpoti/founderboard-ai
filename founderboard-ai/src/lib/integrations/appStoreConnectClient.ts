/**
 * App Store Connect API Client
 *
 * Handles JWT generation and API calls to App Store Connect.
 * Documentation: https://developer.apple.com/documentation/appstoreconnectapi
 */

import jwt from 'jsonwebtoken'
import { gunzipSync } from 'zlib'

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
   * Make a raw authenticated API request (for non-JSON responses like gzipped data).
   */
  private async requestRaw(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getToken()

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `App Store Connect API error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return response
  }

  /**
   * Get sales and trends reports.
   * Returns download units and revenue for each app.
   * Note: Reports are typically available with a 1-day delay.
   */
  async getSalesReports(
    vendorNumber: string,
    reportDate: string
  ): Promise<AppStoreSalesReport[]> {
    console.log(`[SalesReports] Fetching for vendor=${vendorNumber}, date=${reportDate}`)

    try {
      // Build query params for daily summary sales report
      const params = new URLSearchParams({
        'filter[frequency]': 'DAILY',
        'filter[reportSubType]': 'SUMMARY',
        'filter[reportType]': 'SALES',
        'filter[vendorNumber]': vendorNumber,
        'filter[reportDate]': reportDate,
      })

      const endpoint = `/salesReports?${params.toString()}`
      console.log(`[SalesReports] Calling endpoint: ${endpoint}`)

      const response = await this.requestRaw(endpoint)
      console.log(`[SalesReports] Response status: ${response.status}`)

      // Response is gzipped TSV data
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      console.log(`[SalesReports] Response buffer size: ${buffer.length} bytes`)

      // Decompress gzip
      let tsvData: string
      try {
        const decompressed = gunzipSync(buffer)
        tsvData = decompressed.toString('utf-8')
        console.log(`[SalesReports] Decompressed gzip data, size: ${tsvData.length} chars`)
      } catch {
        // If not gzipped, try as plain text
        tsvData = buffer.toString('utf-8')
        console.log(`[SalesReports] Using plain text data, size: ${tsvData.length} chars`)
      }

      // Log first 500 chars of TSV data for debugging
      console.log(`[SalesReports] TSV data preview:\n${tsvData.substring(0, 500)}`)

      // Parse TSV data
      const reports = this.parseSalesReportTSV(tsvData)
      console.log(`[SalesReports] Parsed ${reports.length} reports:`, JSON.stringify(reports, null, 2))

      return reports
    } catch (error) {
      // Sales reports may not be available (404) for dates without data
      // or for accounts without sales
      console.error(`[SalesReports] ERROR for date=${reportDate}:`, error)
      return []
    }
  }

  /**
   * Parse App Store Connect Sales Report TSV data.
   * TSV columns (vary by report type but typically include):
   * Provider, Provider Country, SKU, Developer, Title, Version, Product Type Identifier,
   * Units, Developer Proceeds, Begin Date, End Date, Customer Currency, Country Code,
   * Currency of Proceeds, Apple Identifier, ...
   */
  private parseSalesReportTSV(tsvData: string): AppStoreSalesReport[] {
    const lines = tsvData.trim().split('\n')
    console.log(`[SalesReports:Parse] Total lines: ${lines.length}`)

    if (lines.length < 2) {
      console.log('[SalesReports:Parse] Not enough lines (need at least 2)')
      return []
    }

    // First line is headers
    const headers = lines[0].split('\t').map((h) => h.trim())
    console.log(`[SalesReports:Parse] Headers (${headers.length}):`, headers)

    // Find column indices
    const appleIdIndex = headers.findIndex((h) => h === 'Apple Identifier')
    const unitsIndex = headers.findIndex((h) => h === 'Units')
    const proceedsIndex = headers.findIndex((h) => h === 'Developer Proceeds')
    const currencyIndex = headers.findIndex((h) => h === 'Currency of Proceeds')
    const productTypeIndex = headers.findIndex((h) => h === 'Product Type Identifier')
    const titleIndex = headers.findIndex((h) => h === 'Title')
    const skuIndex = headers.findIndex((h) => h === 'SKU')

    console.log(`[SalesReports:Parse] Column indices - AppleID: ${appleIdIndex}, Units: ${unitsIndex}, Proceeds: ${proceedsIndex}, Currency: ${currencyIndex}, ProductType: ${productTypeIndex}, Title: ${titleIndex}, SKU: ${skuIndex}`)

    if (unitsIndex === -1) {
      console.warn('[SalesReports:Parse] Missing "Units" column!')
      return []
    }

    // Aggregate by app ID
    const appData: Record<string, { units: number; proceeds: number; currency: string }> = {}

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t')
      const appId = appleIdIndex !== -1 ? values[appleIdIndex]?.trim() : 'unknown'
      const units = parseInt(values[unitsIndex]?.trim() || '0', 10) || 0
      const proceeds = parseFloat(values[proceedsIndex]?.trim() || '0') || 0
      const currency = currencyIndex !== -1 ? values[currencyIndex]?.trim() || 'USD' : 'USD'
      const productType = productTypeIndex !== -1 ? values[productTypeIndex]?.trim() : 'unknown'
      const title = titleIndex !== -1 ? values[titleIndex]?.trim() : 'unknown'
      const sku = skuIndex !== -1 ? values[skuIndex]?.trim() : 'unknown'

      // Log first few rows for debugging (include product type and title)
      if (i <= 5) {
        console.log(`[SalesReports:Parse] Row ${i}: appId=${appId}, title="${title}", sku=${sku}, productType=${productType}, units=${units}, proceeds=${proceeds}`)
      }

      if (!appData[appId]) {
        appData[appId] = { units: 0, proceeds: 0, currency }
      }
      appData[appId].units += units
      appData[appId].proceeds += proceeds
    }

    console.log(`[SalesReports:Parse] Aggregated data:`, appData)

    return Object.entries(appData).map(([appId, data]) => ({
      appId,
      units: data.units,
      proceeds: data.proceeds,
      proceedsCurrency: data.currency,
    }))
  }

  /**
   * Get the vendor number for this account.
   * The vendor number is required for sales reports.
   */
  async getVendorNumber(): Promise<string | null> {
    interface FinanceReportsResponse {
      data: Array<{
        id: string
        attributes: {
          vendorNumber: string
        }
      }>
    }

    try {
      // Try to get vendor info from finance reports endpoint
      const response = await this.request<FinanceReportsResponse>(
        '/financeReports?filter[reportType]=FINANCIAL&limit=1'
      )
      if (response.data && response.data.length > 0) {
        return response.data[0].attributes.vendorNumber
      }
    } catch {
      // Finance reports may not be accessible, try alternative
    }

    // Alternative: Get from sales reports with a known date (will fail but error may contain vendor info)
    // For now, return null - vendor number should be stored in integration config
    return null
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
