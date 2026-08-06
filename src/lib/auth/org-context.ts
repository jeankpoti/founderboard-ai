import { cookies } from 'next/headers'
import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { verifySession, type SessionUser } from './session'
import { getGuestOrgContext } from './guest-context'
import type { Organization, Membership, Role } from '@/types/organization'

const CURRENT_ORG_COOKIE = 'currentOrgId'

// Helper to convert Firestore Timestamps to ISO strings for serialization
function serializeFirestoreDoc<T>(doc: Record<string, unknown>): T {
  const serialized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(doc)) {
    if (value && typeof value === 'object' && '_seconds' in value && '_nanoseconds' in value) {
      // Convert Firestore Timestamp to ISO string
      const timestamp = value as { _seconds: number; _nanoseconds: number }
      serialized[key] = new Date(timestamp._seconds * 1000).toISOString()
    } else if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
      // Handle Timestamp objects with toDate method
      serialized[key] = (value as { toDate: () => Date }).toDate().toISOString()
    } else {
      serialized[key] = value
    }
  }

  return serialized as T
}

export interface OrgContext {
  user: SessionUser
  organization: Organization
  membership: Membership
  role: Role
}

/**
 * Get the current organization context for the authenticated user.
 * Returns guest context for unauthenticated users (recruiter mode).
 * Returns null only if user is authenticated but has no organizations.
 */
export async function getOrgContext(): Promise<OrgContext | null> {
  const { user } = await verifySession()

  // No authenticated user - return guest context for demo access
  if (!user) {
    return getGuestOrgContext()
  }

  // Authenticated user but no organizations - needs onboarding
  if (!user.linkedOrgIds || user.linkedOrgIds.length === 0) {
    return null
  }

  const db = adminDb()
  const cookieStore = await cookies()

  // Get current org from cookie, or use first linked org
  let currentOrgId = cookieStore.get(CURRENT_ORG_COOKIE)?.value

  // Validate that user has access to this org
  if (!currentOrgId || !user.linkedOrgIds.includes(currentOrgId)) {
    currentOrgId = user.linkedOrgIds[0]
  }

  // Fetch organization
  const orgDoc = await db.collection(COLLECTIONS.ORGANIZATIONS).doc(currentOrgId).get()

  if (!orgDoc.exists) {
    // Org was deleted, use first available
    currentOrgId = user.linkedOrgIds[0]
    const fallbackOrgDoc = await db.collection(COLLECTIONS.ORGANIZATIONS).doc(currentOrgId).get()
    if (!fallbackOrgDoc.exists) {
      return null
    }
  }

  const organization = serializeFirestoreDoc<Organization>({ id: orgDoc.id, ...orgDoc.data() })

  // Fetch membership to get role
  const membershipId = `${user.uid}_${currentOrgId}`
  const membershipDoc = await db.collection(COLLECTIONS.MEMBERSHIPS).doc(membershipId).get()

  if (!membershipDoc.exists) {
    return null
  }

  const membership = serializeFirestoreDoc<Membership>({ id: membershipDoc.id, ...membershipDoc.data() })

  return {
    user,
    organization,
    membership,
    role: membership.role,
  }
}

/**
 * Get all organizations the user is a member of.
 */
export async function getUserOrganizations(): Promise<Organization[]> {
  const { user } = await verifySession()

  if (!user || !user.linkedOrgIds || user.linkedOrgIds.length === 0) {
    return []
  }

  const db = adminDb()
  const orgs: Organization[] = []

  // Fetch all organizations
  for (const orgId of user.linkedOrgIds) {
    const orgDoc = await db.collection(COLLECTIONS.ORGANIZATIONS).doc(orgId).get()
    if (orgDoc.exists) {
      orgs.push(serializeFirestoreDoc<Organization>({ id: orgDoc.id, ...orgDoc.data() }))
    }
  }

  return orgs
}

/**
 * Set the current organization for the user.
 */
export async function setCurrentOrganization(orgId: string): Promise<boolean> {
  const { user } = await verifySession()

  if (!user || !user.linkedOrgIds?.includes(orgId)) {
    return false
  }

  const cookieStore = await cookies()
  cookieStore.set(CURRENT_ORG_COOKIE, orgId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })

  return true
}
