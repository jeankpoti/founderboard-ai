/**
 * Mock Data Module
 *
 * Provides realistic mock data for demo purposes.
 * Mock data is shown when integrations are not connected.
 * When a user connects a real integration, real data replaces the mock data.
 *
 * Usage:
 * - Use the `*WithMock` functions from `@/lib/actions/data-with-mocks`
 * - These automatically check integration status and return mock or real data
 */

// Utilities
export {
  generateId,
  randomBetween,
  randomFloat,
  generateDateRange,
  daysAgo,
  randomPick,
  randomPickMultiple,
  generateTrendingValue,
  isIntegrationConnected,
  getActiveIntegrationId,
  MOCK_ORG_ID,
  MOCK_INTEGRATION_PREFIX,
  MOCK_TEAM_MEMBERS,
} from './utils'

// All factories
export * from './factories'
