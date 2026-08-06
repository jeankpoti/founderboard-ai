/**
 * Guest Context for Unauthenticated Users
 *
 * Provides mock organization and user data for recruiters/visitors
 * who want to explore the dashboard without registering.
 */

import type { SessionUser } from './session'
import type { OrgContext } from './org-context'
import type { Organization, Membership } from '@/types/organization'

// ========================================
// GUEST USER & ORGANIZATION
// ========================================

export const GUEST_USER: SessionUser = {
  uid: 'guest-user',
  email: null,
  displayName: 'Guest',
  photoURL: null,
  linkedOrgIds: ['guest-demo-org'],
}

export const GUEST_ORGANIZATION: Organization = {
  id: 'guest-demo-org',
  name: 'Demo Company',
  slug: 'demo',
  ownerId: 'guest-user',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const GUEST_MEMBERSHIP: Membership = {
  id: 'guest-user_guest-demo-org',
  userId: 'guest-user',
  orgId: 'guest-demo-org',
  role: 'viewer', // Guests are viewers - can see but not edit
  joinedAt: new Date().toISOString(),
}

// ========================================
// GUEST CONTEXT FUNCTIONS
// ========================================

/**
 * Get the guest organization context.
 * Used when a user is not authenticated but viewing the dashboard.
 */
export function getGuestOrgContext(): OrgContext {
  return {
    user: GUEST_USER,
    organization: GUEST_ORGANIZATION,
    membership: GUEST_MEMBERSHIP,
    role: 'viewer',
  }
}

/**
 * Check if a user object represents a guest.
 */
export function isGuestUser(user: SessionUser | null): boolean {
  return user?.uid === 'guest-user'
}

/**
 * Check if an organization is the guest demo org.
 */
export function isGuestOrg(orgId: string): boolean {
  return orgId === 'guest-demo-org'
}
