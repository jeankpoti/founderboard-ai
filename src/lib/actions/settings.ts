'use server'

import { adminDb, adminAuth } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { getOrgContext } from '@/lib/auth/org-context'
import { verifySession } from '@/lib/auth/session'
import type { ApiResponse } from '@/types/api'

// Profile actions
export async function updateProfile(input: {
  displayName: string
}): Promise<ApiResponse<void>> {
  try {
    const { user: sessionUser } = await verifySession()
    if (!sessionUser) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const displayName = input.displayName.trim()
    if (!displayName || displayName.length > 100) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid display name' },
      }
    }

    const db = adminDb()
    const auth = adminAuth()

    // Update Firebase Auth user
    await auth.updateUser(sessionUser.uid, { displayName })

    // Update Firestore user document
    await db.collection(COLLECTIONS.USERS).doc(sessionUser.uid).update({
      displayName,
      updatedAt: new Date(),
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Update profile error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' },
    }
  }
}

// Organization settings actions
export async function updateOrganization(input: {
  name: string
}): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role !== 'owner' && orgContext.role !== 'admin') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can update organization' },
      }
    }

    const name = input.name.trim()
    if (!name || name.length > 100) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid organization name' },
      }
    }

    const db = adminDb()
    await db.collection(COLLECTIONS.ORGANIZATIONS).doc(orgContext.organization.id).update({
      name,
      updatedAt: new Date(),
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Update organization error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update organization' },
    }
  }
}

// Team management actions
interface TeamMember {
  id: string
  memberId: string
  userId: string
  email: string
  displayName: string
  role: string
  joinedAt: Date
}

export async function getTeamMembers(): Promise<ApiResponse<TeamMember[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    const membershipsSnapshot = await db
      .collection(COLLECTIONS.MEMBERSHIPS)
      .where('orgId', '==', orgContext.organization.id)
      .get()

    const members: TeamMember[] = []

    for (const membershipDoc of membershipsSnapshot.docs) {
      const membership = membershipDoc.data()
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(membership.userId).get()
      const userData = userDoc.exists ? userDoc.data() : null

      members.push({
        id: membershipDoc.id,
        memberId: membershipDoc.id,
        userId: membership.userId,
        email: userData?.email || '',
        displayName: userData?.displayName || 'Unknown',
        role: membership.role,
        joinedAt: membership.joinedAt?.toDate?.() || new Date(),
      })
    }

    return { success: true, data: members }
  } catch (error) {
    console.error('Get team members error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch team members' },
    }
  }
}

interface PendingInvite {
  id: string
  email: string
  role: string
  invitedAt: Date
}

export async function getPendingInvites(): Promise<ApiResponse<PendingInvite[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    const invitesSnapshot = await db
      .collection(COLLECTIONS.INVITATIONS)
      .where('orgId', '==', orgContext.organization.id)
      .where('status', '==', 'pending')
      .get()

    const invites: PendingInvite[] = invitesSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        email: data.email,
        role: data.role,
        invitedAt: data.invitedAt?.toDate?.() || new Date(),
      }
    })

    return { success: true, data: invites }
  } catch (error) {
    console.error('Get pending invites error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch invites' },
    }
  }
}

export async function inviteMember(input: {
  email: string
  role: 'admin' | 'member' | 'viewer'
}): Promise<ApiResponse<{ inviteId: string }>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role !== 'owner' && orgContext.role !== 'admin') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can invite members' },
      }
    }

    const email = input.email.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid email' },
      }
    }

    const db = adminDb()

    // Check if already a member
    const existingUserSnapshot = await db
      .collection(COLLECTIONS.USERS)
      .where('email', '==', email)
      .limit(1)
      .get()

    if (!existingUserSnapshot.empty) {
      const existingUserId = existingUserSnapshot.docs[0].id
      const existingMembershipSnapshot = await db
        .collection(COLLECTIONS.MEMBERSHIPS)
        .where('userId', '==', existingUserId)
        .where('orgId', '==', orgContext.organization.id)
        .limit(1)
        .get()

      if (!existingMembershipSnapshot.empty) {
        return {
          success: false,
          error: { code: 'ALREADY_EXISTS', message: 'User is already a member' },
        }
      }
    }

    // Check for existing pending invite
    const existingInviteSnapshot = await db
      .collection(COLLECTIONS.INVITATIONS)
      .where('orgId', '==', orgContext.organization.id)
      .where('email', '==', email)
      .where('status', '==', 'pending')
      .limit(1)
      .get()

    if (!existingInviteSnapshot.empty) {
      return {
        success: false,
        error: { code: 'ALREADY_EXISTS', message: 'Invite already pending for this email' },
      }
    }

    // Create invitation
    const inviteRef = db.collection(COLLECTIONS.INVITATIONS).doc()
    const inviteData = {
      orgId: orgContext.organization.id,
      orgName: orgContext.organization.name,
      email,
      role: input.role,
      status: 'pending',
      invitedBy: orgContext.user.uid,
      invitedAt: new Date(),
      token: inviteRef.id, // Use doc ID as token
    }

    await inviteRef.set(inviteData)

    return { success: true, data: { inviteId: inviteRef.id } }
  } catch (error) {
    console.error('Invite member error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to send invite' },
    }
  }
}

export async function cancelInvite(inviteId: string): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role !== 'owner' && orgContext.role !== 'admin') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can cancel invites' },
      }
    }

    const db = adminDb()
    const inviteRef = db.collection(COLLECTIONS.INVITATIONS).doc(inviteId)
    const inviteDoc = await inviteRef.get()

    if (!inviteDoc.exists || inviteDoc.data()?.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invite not found' },
      }
    }

    await inviteRef.delete()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Cancel invite error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel invite' },
    }
  }
}

export async function updateMemberRole(
  memberId: string,
  newRole: 'admin' | 'member' | 'viewer'
): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role !== 'owner') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Only owners can change roles' },
      }
    }

    const db = adminDb()
    const memberRef = db.collection(COLLECTIONS.MEMBERSHIPS).doc(memberId)
    const memberDoc = await memberRef.get()

    if (!memberDoc.exists || memberDoc.data()?.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Member not found' },
      }
    }

    const memberData = memberDoc.data()
    if (memberData?.role === 'owner') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Cannot change owner role directly' },
      }
    }

    await memberRef.update({ role: newRole, updatedAt: new Date() })

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Update member role error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update role' },
    }
  }
}

export async function removeMember(memberId: string): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role !== 'owner' && orgContext.role !== 'admin') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can remove members' },
      }
    }

    const db = adminDb()
    const memberRef = db.collection(COLLECTIONS.MEMBERSHIPS).doc(memberId)
    const memberDoc = await memberRef.get()

    if (!memberDoc.exists || memberDoc.data()?.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Member not found' },
      }
    }

    const memberData = memberDoc.data()
    if (memberData?.role === 'owner') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Cannot remove the owner' },
      }
    }

    // Remove membership
    await memberRef.delete()

    // Remove org from user's linkedOrgIds
    const userRef = db.collection(COLLECTIONS.USERS).doc(memberData?.userId)
    const userDoc = await userRef.get()
    if (userDoc.exists) {
      const userData = userDoc.data()
      const linkedOrgIds = (userData?.linkedOrgIds || []).filter(
        (id: string) => id !== orgContext.organization.id
      )
      await userRef.update({
        linkedOrgIds,
        currentOrgId:
          userData?.currentOrgId === orgContext.organization.id
            ? linkedOrgIds[0] || null
            : userData?.currentOrgId,
      })
    }

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Remove member error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to remove member' },
    }
  }
}

export async function transferOwnership(newOwnerId: string): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role !== 'owner') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Only owners can transfer ownership' },
      }
    }

    const db = adminDb()

    // Find current owner membership
    const currentOwnerSnapshot = await db
      .collection(COLLECTIONS.MEMBERSHIPS)
      .where('orgId', '==', orgContext.organization.id)
      .where('userId', '==', orgContext.user.uid)
      .limit(1)
      .get()

    if (currentOwnerSnapshot.empty) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Owner membership not found' },
      }
    }

    // Find new owner membership
    const newOwnerSnapshot = await db
      .collection(COLLECTIONS.MEMBERSHIPS)
      .where('orgId', '==', orgContext.organization.id)
      .where('userId', '==', newOwnerId)
      .limit(1)
      .get()

    if (newOwnerSnapshot.empty) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'New owner must be a member' },
      }
    }

    const batch = db.batch()

    // Update current owner to admin
    batch.update(currentOwnerSnapshot.docs[0].ref, {
      role: 'admin',
      updatedAt: new Date(),
    })

    // Update new owner
    batch.update(newOwnerSnapshot.docs[0].ref, {
      role: 'owner',
      updatedAt: new Date(),
    })

    // Update organization owner
    batch.update(db.collection(COLLECTIONS.ORGANIZATIONS).doc(orgContext.organization.id), {
      ownerId: newOwnerId,
      updatedAt: new Date(),
    })

    await batch.commit()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Transfer ownership error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to transfer ownership' },
    }
  }
}

export async function deleteOrganization(): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role !== 'owner') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Only owners can delete organizations' },
      }
    }

    const db = adminDb()
    const orgId = orgContext.organization.id
    const batch = db.batch()

    // Delete all memberships
    const membershipsSnapshot = await db
      .collection(COLLECTIONS.MEMBERSHIPS)
      .where('orgId', '==', orgId)
      .get()

    membershipsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Delete all invitations
    const invitationsSnapshot = await db
      .collection(COLLECTIONS.INVITATIONS)
      .where('orgId', '==', orgId)
      .get()

    invitationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Delete all metrics
    const metricsSnapshot = await db
      .collection(COLLECTIONS.METRICS)
      .where('orgId', '==', orgId)
      .get()

    metricsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Delete all tasks
    const tasksSnapshot = await db
      .collection(COLLECTIONS.TASKS)
      .where('orgId', '==', orgId)
      .get()

    tasksSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })

    // Delete organization
    batch.delete(db.collection(COLLECTIONS.ORGANIZATIONS).doc(orgId))

    await batch.commit()

    // Update all affected users
    for (const memberDoc of membershipsSnapshot.docs) {
      const membership = memberDoc.data()
      const userRef = db.collection(COLLECTIONS.USERS).doc(membership.userId)
      const userDoc = await userRef.get()

      if (userDoc.exists) {
        const userData = userDoc.data()
        const linkedOrgIds = (userData?.linkedOrgIds || []).filter((id: string) => id !== orgId)
        await userRef.update({
          linkedOrgIds,
          currentOrgId: userData?.currentOrgId === orgId ? linkedOrgIds[0] || null : userData?.currentOrgId,
        })
      }
    }

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete organization error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete organization' },
    }
  }
}

// Accept invitation action
export async function getInviteDetails(
  token: string
): Promise<ApiResponse<{ orgName: string; role: string; email: string }>> {
  try {
    const db = adminDb()
    const inviteDoc = await db.collection(COLLECTIONS.INVITATIONS).doc(token).get()

    if (!inviteDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invitation not found' },
      }
    }

    const inviteData = inviteDoc.data()
    if (inviteData?.status !== 'pending') {
      return {
        success: false,
        error: { code: 'INVALID_STATE', message: 'Invitation has already been used' },
      }
    }

    return {
      success: true,
      data: {
        orgName: inviteData.orgName,
        role: inviteData.role,
        email: inviteData.email,
      },
    }
  } catch (error) {
    console.error('Get invite details error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get invite details' },
    }
  }
}

export async function acceptInvitation(token: string): Promise<ApiResponse<{ orgId: string }>> {
  try {
    const { user: sessionUser } = await verifySession()
    if (!sessionUser) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Please log in to accept the invitation' },
      }
    }

    const db = adminDb()
    const inviteRef = db.collection(COLLECTIONS.INVITATIONS).doc(token)
    const inviteDoc = await inviteRef.get()

    if (!inviteDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Invitation not found' },
      }
    }

    const inviteData = inviteDoc.data()
    if (inviteData?.status !== 'pending') {
      return {
        success: false,
        error: { code: 'INVALID_STATE', message: 'Invitation has already been used' },
      }
    }

    // Check if user email matches invite email
    if (sessionUser.email?.toLowerCase() !== inviteData.email?.toLowerCase()) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: `This invitation is for ${inviteData.email}`,
        },
      }
    }

    // Check if already a member
    const existingMemberSnapshot = await db
      .collection(COLLECTIONS.MEMBERSHIPS)
      .where('userId', '==', sessionUser.uid)
      .where('orgId', '==', inviteData.orgId)
      .limit(1)
      .get()

    if (!existingMemberSnapshot.empty) {
      // Already a member, just mark invite as accepted
      await inviteRef.update({ status: 'accepted', acceptedAt: new Date() })
      return { success: true, data: { orgId: inviteData.orgId } }
    }

    const batch = db.batch()

    // Create membership
    const membershipRef = db.collection(COLLECTIONS.MEMBERSHIPS).doc()
    batch.set(membershipRef, {
      userId: sessionUser.uid,
      orgId: inviteData.orgId,
      role: inviteData.role,
      joinedAt: new Date(),
    })

    // Update user's linkedOrgIds
    const userRef = db.collection(COLLECTIONS.USERS).doc(sessionUser.uid)
    const userDoc = await userRef.get()
    const userData = userDoc.data()
    const linkedOrgIds = userData?.linkedOrgIds || []

    batch.update(userRef, {
      linkedOrgIds: [...linkedOrgIds, inviteData.orgId],
      currentOrgId: inviteData.orgId,
    })

    // Mark invitation as accepted
    batch.update(inviteRef, {
      status: 'accepted',
      acceptedAt: new Date(),
      acceptedBy: sessionUser.uid,
    })

    await batch.commit()

    return { success: true, data: { orgId: inviteData.orgId } }
  } catch (error) {
    console.error('Accept invitation error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to accept invitation' },
    }
  }
}
