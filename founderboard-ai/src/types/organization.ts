export type Role = 'owner' | 'admin' | 'member' | 'viewer'

export interface Organization {
  id: string
  name: string
  slug: string
  ownerId: string
  createdAt: string // ISO date string
  updatedAt: string // ISO date string
}

export interface Membership {
  id: string // format: {userId}_{orgId}
  userId: string
  orgId: string
  role: Role
  joinedAt: string // ISO date string
}

export interface Invitation {
  id: string
  email: string
  orgId: string
  role: Role
  token: string
  invitedBy: string
  expiresAt: string // ISO date string
  acceptedAt: string | null // ISO date string
  createdAt: string // ISO date string
}

// Permission helpers
export const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
}

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function canEditMetrics(role: Role): boolean {
  return hasPermission(role, 'member')
}

export function canManageTeam(role: Role): boolean {
  return hasPermission(role, 'admin')
}

export function canManageOrg(role: Role): boolean {
  return role === 'owner'
}
