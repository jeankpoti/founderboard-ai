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
  sku: string
  parentIdentifier?: string
  /** New downloads (product type 1F, 1T, 1, F1, etc.) */
  downloads: number
  /** Re-downloads (product type 3F, 3T, 3, F3, etc.) */
  redownloads: number
  /** Updates (product type 7F, 7T, 7, F7, etc.) */
  updates: number
  /** Total units (downloads + redownloads, excludes updates) */
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
   * Get public App Store metadata for a bundle ID.
   * This fills rating summary data that App Store Connect's customer reviews API
   * does not expose when users leave a star rating without a written review.
   */
  async getPublicAppMetadata(bundleId: string): Promise<{
    trackId: number
    averageRating: number
    ratingCount: number
  } | null> {
    interface LookupResponse {
      resultCount: number
      results: Array<{
        trackId: number
        averageUserRating?: number
        userRatingCount?: number
      }>
    }

    try {
      const response = await fetch(
        `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(bundleId)}&country=us`
      )

      if (!response.ok) {
        return null
      }

      const data = await response.json() as LookupResponse
      const app = data.results[0]
      if (!app) {
        return null
      }

      return {
        trackId: app.trackId,
        averageRating: app.averageUserRating ?? 0,
        ratingCount: app.userRatingCount ?? 0,
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
    const parentIdentifierIndex = headers.findIndex((h) => h === 'Parent Identifier')

    console.log(`[SalesReports:Parse] Column indices - AppleID: ${appleIdIndex}, Units: ${unitsIndex}, Proceeds: ${proceedsIndex}, Currency: ${currencyIndex}, ProductType: ${productTypeIndex}, Title: ${titleIndex}, SKU: ${skuIndex}`)

    if (unitsIndex === -1) {
      console.warn('[SalesReports:Parse] Missing "Units" column!')
      return []
    }

    // Aggregate by app ID, categorizing by product type
    // Product types: 1/1F/1T/F1 = new download, 3/3F/3T/F3 = re-download, 7/7F/7T/F7 = update
    // See: https://developer.apple.com/help/app-store-connect/reference/reporting/product-type-identifiers/
    const appData: Record<string, {
      sku: string
      parentIdentifier?: string
      downloads: number
      redownloads: number
      updates: number
      proceeds: number
      currency: string
    }> = {}

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t')
      const appId = appleIdIndex !== -1 ? values[appleIdIndex]?.trim() : 'unknown'
      const units = parseInt(values[unitsIndex]?.trim() || '0', 10) || 0
      const proceeds = parseFloat(values[proceedsIndex]?.trim() || '0') || 0
      const currency = currencyIndex !== -1 ? values[currencyIndex]?.trim() || 'USD' : 'USD'
      const productType = productTypeIndex !== -1 ? values[productTypeIndex]?.trim() : 'unknown'
      const title = titleIndex !== -1 ? values[titleIndex]?.trim() : 'unknown'
      const sku = skuIndex !== -1 ? values[skuIndex]?.trim() : 'unknown'
      const parentIdentifier =
        parentIdentifierIndex !== -1 ? values[parentIdentifierIndex]?.trim() || undefined : undefined

      // Log first few rows for debugging (include product type and title)
      if (i <= 5) {
        console.log(`[SalesReports:Parse] Row ${i}: appId=${appId}, title="${title}", sku=${sku}, parentIdentifier=${parentIdentifier || 'n/a'}, productType=${productType}, units=${units}, proceeds=${proceeds}`)
      }

      if (!appData[appId]) {
        appData[appId] = {
          sku,
          parentIdentifier,
          downloads: 0,
          redownloads: 0,
          updates: 0,
          proceeds: 0,
          currency,
        }
      }

      // Categorize units by product type
      // Product types starting with 1 = new downloads (1, 1F, 1T, F1, etc.)
      // Product types starting with 3 = re-downloads (3, 3F, 3T, F3, etc.)
      // Product types starting with 7 = updates (7, 7F, 7T, F7, etc.)
      if (productType.startsWith('1') || productType === 'F1' || productType === 'T1') {
        appData[appId].downloads += units
      } else if (productType.startsWith('3') || productType === 'F3' || productType === 'T3') {
        appData[appId].redownloads += units
      } else if (productType.startsWith('7') || productType === 'F7' || productType === 'T7') {
        appData[appId].updates += units
      } else {
        // Unknown product type - treat as download to be safe
        console.log(`[SalesReports:Parse] Unknown product type "${productType}", counting as download`)
        appData[appId].downloads += units
      }

      appData[appId].proceeds += proceeds * units
    }

    console.log(`[SalesReports:Parse] Aggregated data:`, appData)

    return Object.entries(appData).map(([appId, data]) => ({
      appId,
      sku: data.sku,
      parentIdentifier: data.parentIdentifier,
      downloads: data.downloads,
      redownloads: data.redownloads,
      updates: data.updates,
      // Total units = downloads + redownloads (NOT updates)
      units: data.downloads + data.redownloads,
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

  // ========================================
  // ANALYTICS REPORTS API
  // ========================================

  /**
   * Create an analytics report request for an app.
   * Note: Requires Admin role API key.
   * Reports take 1-2 days to generate after first request.
   *
   * @param appId - The app ID to request analytics for
   * @param accessType - ONE_TIME_SNAPSHOT or ONGOING
   */
  async createAnalyticsReportRequest(
    appId: string,
    accessType: 'ONE_TIME_SNAPSHOT' | 'ONGOING' = 'ONGOING'
  ): Promise<string | null> {
    interface AnalyticsReportRequestResponse {
      data: {
        id: string
        type: 'analyticsReportRequests'
        attributes: {
          accessType: string
          stoppedDueToInactivity: boolean
        }
      }
    }

    try {
      const response = await this.request<AnalyticsReportRequestResponse>(
        '/analyticsReportRequests',
        {
          method: 'POST',
          body: JSON.stringify({
            data: {
              type: 'analyticsReportRequests',
              attributes: { accessType },
              relationships: {
                app: {
                  data: { type: 'apps', id: appId }
                }
              }
            }
          })
        }
      )
      return response.data.id
    } catch (error) {
      console.error('[Analytics] Failed to create report request:', error)
      return null
    }
  }

  /**
   * Get existing analytics report requests for an app.
   */
  async getAnalyticsReportRequests(appId: string): Promise<Array<{
    id: string
    accessType: string
    stoppedDueToInactivity: boolean
  }>> {
    interface AnalyticsReportRequestsResponse {
      data: Array<{
        id: string
        type: 'analyticsReportRequests'
        attributes: {
          accessType: string
          stoppedDueToInactivity: boolean
        }
      }>
    }

    try {
      const response = await this.request<AnalyticsReportRequestsResponse>(
        `/apps/${appId}/analyticsReportRequests`
      )
      return response.data.map(r => ({
        id: r.id,
        accessType: r.attributes.accessType,
        stoppedDueToInactivity: r.attributes.stoppedDueToInactivity
      }))
    } catch (error) {
      console.error('[Analytics] Failed to get report requests:', error)
      return []
    }
  }

  /**
   * Get available analytics reports for a report request.
   * Filter by category (e.g., 'APP_USAGE') to get specific report types.
   */
  async getAnalyticsReports(
    reportRequestId: string,
    category?: 'APP_USAGE' | 'APP_STORE_ENGAGEMENT' | 'PERFORMANCE'
  ): Promise<Array<{
    id: string
    category: string
    name: string
  }>> {
    interface AnalyticsReportsResponse {
      data: Array<{
        id: string
        type: 'analyticsReports'
        attributes: {
          category: string
          name: string
        }
      }>
    }

    try {
      let endpoint = `/analyticsReportRequests/${reportRequestId}/reports`
      if (category) {
        endpoint += `?filter[category]=${category}`
      }
      const response = await this.request<AnalyticsReportsResponse>(endpoint)
      return response.data.map(r => ({
        id: r.id,
        category: r.attributes.category,
        name: r.attributes.name
      }))
    } catch (error) {
      console.error('[Analytics] Failed to get reports:', error)
      return []
    }
  }

  /**
   * Get report instances (actual downloadable data) for a report.
   * Returns the most recent instances with download URLs.
   */
  async getReportInstances(reportId: string): Promise<Array<{
    id: string
    granularity: string
    processingDate: string
    downloadUrl: string | null
  }>> {
    interface ReportInstancesResponse {
      data: Array<{
        id: string
        type: 'analyticsReportInstances'
        attributes: {
          granularity: string
          processingDate: string
        }
        relationships?: {
          segments?: {
            data: Array<{ id: string; type: string }>
          }
        }
      }>
      included?: Array<{
        id: string
        type: 'analyticsReportSegments'
        attributes: {
          checksum: string
          sizeInBytes: number
          url: string
        }
      }>
    }

    try {
      const response = await this.request<ReportInstancesResponse>(
        `/analyticsReports/${reportId}/instances?include=segments&limit=10`
      )

      // Build a map of segment URLs by ID
      const segmentUrls = new Map<string, string>()
      if (response.included) {
        for (const segment of response.included) {
          if (segment.type === 'analyticsReportSegments') {
            segmentUrls.set(segment.id, segment.attributes.url)
          }
        }
      }

      return response.data.map(instance => {
        // Get the first segment URL if available
        const segmentId = instance.relationships?.segments?.data?.[0]?.id
        const downloadUrl = segmentId ? segmentUrls.get(segmentId) || null : null

        return {
          id: instance.id,
          granularity: instance.attributes.granularity,
          processingDate: instance.attributes.processingDate,
          downloadUrl
        }
      })
    } catch (error) {
      console.error('[Analytics] Failed to get report instances:', error)
      return []
    }
  }

  /**
   * Download and parse an analytics report from a URL.
   * Returns parsed data rows.
   */
  async downloadAnalyticsReport(downloadUrl: string): Promise<Record<string, string>[]> {
    try {
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Decompress gzip
      let tsvData: string
      try {
        const decompressed = gunzipSync(buffer)
        tsvData = decompressed.toString('utf-8')
      } catch {
        tsvData = buffer.toString('utf-8')
      }

      // Parse TSV
      const lines = tsvData.trim().split('\n')
      if (lines.length < 2) return []

      const headers = lines[0].split('\t').map(h => h.trim())
      const rows: Record<string, string>[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split('\t')
        const row: Record<string, string> = {}
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = values[j]?.trim() || ''
        }
        rows.push(row)
      }

      return rows
    } catch (error) {
      console.error('[Analytics] Failed to download report:', error)
      return []
    }
  }

  /**
   * Get app usage metrics (active devices, installs, sessions).
   * This is a convenience method that handles the full flow.
   *
   * Note: Analytics reports must be requested first and take 1-2 days to generate.
   * Returns null if no data is available yet.
   */
  async getAppUsageMetrics(appId: string): Promise<{
    activeDevices: number
    installs: number
    sessions: number
    date: string
  } | null> {
    try {
      // 1. Check for existing report requests
      const reportRequests = await this.getAnalyticsReportRequests(appId)

      // 2. If no requests exist, create one (requires Admin role)
      if (reportRequests.length === 0) {
        console.log('[Analytics] No report requests found, creating one...')
        const requestId = await this.createAnalyticsReportRequest(appId, 'ONGOING')
        if (!requestId) {
          console.log('[Analytics] Failed to create report request (may need Admin role)')
          return null
        }
        // Reports take time to generate, return null for now
        console.log('[Analytics] Report request created, data will be available in 1-2 days')
        return null
      }

      // 3. Get APP_USAGE reports
      const activeRequest = reportRequests.find(r => !r.stoppedDueToInactivity)
      if (!activeRequest) {
        console.log('[Analytics] No active report requests')
        return null
      }

      const reports = await this.getAnalyticsReports(activeRequest.id, 'APP_USAGE')
      if (reports.length === 0) {
        console.log('[Analytics] No APP_USAGE reports available yet')
        return null
      }

      // 4. Scan APP_USAGE reports because Active Devices may live under
      // reports like "App Sessions" rather than a dedicated report name.
      let totalActiveDevices: number | null = null
      let totalInstalls = 0
      let totalSessions = 0
      let latestDate: string | null = null

      for (const report of reports) {
        const instances = await this.getReportInstances(report.id)
        const latestInstance = instances.find((instance) => instance.downloadUrl)

        if (!latestInstance?.downloadUrl) {
          continue
        }

        const rows = await this.downloadAnalyticsReport(latestInstance.downloadUrl)
        if (rows.length === 0) {
          continue
        }

        if (!latestDate || latestInstance.processingDate > latestDate) {
          latestDate = latestInstance.processingDate
        }

        for (const row of rows) {
          const devices = this.parseMetricValue(row, [
            'Active Devices',
            'Active Devices Total',
            'activeDevices',
            'active_devices',
          ])
          const installs = this.parseMetricValue(row, [
            'Installs',
            'Installations',
            'Total Downloads',
            'installs',
          ])
          const sessions = this.parseMetricValue(row, [
            'Sessions',
            'sessionCount',
            'sessions',
          ])

          if (devices !== null) {
            totalActiveDevices = (totalActiveDevices || 0) + devices
          }
          if (installs !== null) {
            totalInstalls += installs
          }
          if (sessions !== null) {
            totalSessions += sessions
          }
        }
      }

      if (totalActiveDevices === null && totalInstalls === 0 && totalSessions === 0) {
        console.log('[Analytics] No usage metrics found in APP_USAGE reports')
        return null
      }

      return {
        activeDevices: totalActiveDevices || 0,
        installs: totalInstalls,
        sessions: totalSessions,
        date: latestDate || new Date().toISOString().split('T')[0]
      }
    } catch (error) {
      console.error('[Analytics] Failed to get app usage metrics:', error)
      return null
    }
  }

  private parseMetricValue(
    row: Record<string, string>,
    candidateKeys: string[]
  ): number | null {
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = key.replace(/\s+/g, '').toLowerCase()
      const matched = candidateKeys.some(
        (candidate) => normalizedKey === candidate.replace(/\s+/g, '').toLowerCase()
      )

      if (!matched) {
        continue
      }

      const normalizedValue = value.replace(/,/g, '').trim()
      if (!normalizedValue) {
        return 0
      }

      const parsed = parseInt(normalizedValue, 10)
      return Number.isNaN(parsed) ? null : parsed
    }

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
