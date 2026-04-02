'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  getTeamMembers,
  getPendingInvites,
  inviteMember,
  cancelInvite,
  updateMemberRole,
  removeMember,
  transferOwnership,
} from '@/lib/actions/settings'

interface TeamMember {
  id: string
  memberId: string
  userId: string
  email: string
  displayName: string
  role: string
  joinedAt: Date
}

interface PendingInvite {
  id: string
  email: string
  role: string
  invitedAt: Date
}

interface TeamSettingsProps {
  currentUserId: string
  role: string
}

export function TeamSettings({ currentUserId, role }: TeamSettingsProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invites, setInvites] = useState<PendingInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [isInviting, setIsInviting] = useState(false)

  // Transfer ownership modal
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferToId, setTransferToId] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)

  const canInvite = role === 'owner' || role === 'admin'
  const canManageRoles = role === 'owner'
  const canRemove = role === 'owner' || role === 'admin'
  const canTransfer = role === 'owner'

  const loadData = useCallback(async () => {
    const [membersResult, invitesResult] = await Promise.all([
      getTeamMembers(),
      getPendingInvites(),
    ])

    if (membersResult.success && membersResult.data) {
      setMembers(membersResult.data)
    }
    if (invitesResult.success && invitesResult.data) {
      setInvites(invitesResult.data)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsInviting(true)

    try {
      const result = await inviteMember({ email: inviteEmail.trim(), role: inviteRole })

      if (!result.success) {
        toast.error(result.error?.message || 'Failed to send invite')
        return
      }

      toast.success('Invitation sent')
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('member')
      loadData()
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsInviting(false)
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    const result = await cancelInvite(inviteId)

    if (!result.success) {
      toast.error(result.error?.message || 'Failed to cancel invite')
      return
    }

    toast.success('Invite cancelled')
    setInvites((prev) => prev.filter((i) => i.id !== inviteId))
  }

  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member' | 'viewer') => {
    const result = await updateMemberRole(memberId, newRole)

    if (!result.success) {
      toast.error(result.error?.message || 'Failed to update role')
      return
    }

    toast.success('Role updated')
    setMembers((prev) =>
      prev.map((m) => (m.memberId === memberId ? { ...m, role: newRole } : m))
    )
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    const result = await removeMember(memberId)

    if (!result.success) {
      toast.error(result.error?.message || 'Failed to remove member')
      return
    }

    toast.success('Member removed')
    setMembers((prev) => prev.filter((m) => m.memberId !== memberId))
  }

  const handleTransfer = async () => {
    if (!transferToId) return

    setIsTransferring(true)

    try {
      const result = await transferOwnership(transferToId)

      if (!result.success) {
        toast.error(result.error?.message || 'Failed to transfer ownership')
        return
      }

      toast.success('Ownership transferred')
      setShowTransferModal(false)
      loadData()
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsTransferring(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Team Members</h3>
          {canInvite && (
            <Button onClick={() => setShowInviteModal(true)}>
              Invite Member
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.memberId}
              className="flex items-center justify-between p-3 border rounded-md"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {member.displayName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">{member.displayName}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canManageRoles && member.role !== 'owner' && member.userId !== currentUserId ? (
                  <Select
                    value={member.role}
                    onValueChange={(v) =>
                      handleRoleChange(member.memberId, v as 'admin' | 'member' | 'viewer')
                    }
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs px-2 py-1 bg-muted rounded capitalize">
                    {member.role}
                  </span>
                )}

                {canRemove &&
                  member.role !== 'owner' &&
                  member.userId !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(member.memberId)}
                    >
                      <svg
                        className="h-4 w-4 text-destructive"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </Button>
                  )}
              </div>
            </div>
          ))}
        </div>

        {invites.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Pending Invitations</h4>
            <div className="space-y-2">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-2 border border-dashed rounded-md"
                >
                  <div>
                    <p className="text-sm">{invite.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {invite.role} - Pending
                    </p>
                  </div>
                  {canInvite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvite(invite.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {canTransfer && (
        <Card className="p-6 border-amber-500/50">
          <h3 className="text-lg font-semibold mb-2">Transfer Ownership</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Transfer ownership to another team member. You will become an Admin.
          </p>
          <Button variant="outline" onClick={() => setShowTransferModal(true)}>
            Transfer Ownership
          </Button>
        </Card>
      )}

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteRole">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'admin' | 'member' | 'viewer')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin - Can manage settings and team</SelectItem>
                  <SelectItem value="member">Member - Can edit data</SelectItem>
                  <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                disabled={isInviting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isInviting || !inviteEmail.trim()}>
                {isInviting ? 'Sending...' : 'Send Invite'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Ownership Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Ownership</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a team member to transfer ownership to. You will become an Admin after the
              transfer.
            </p>

            <div className="space-y-2">
              <Label>New Owner</Label>
              <Select value={transferToId} onValueChange={setTransferToId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {members
                    .filter((m) => m.userId !== currentUserId)
                    .map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.displayName} ({member.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTransferModal(false)
                setTransferToId('')
              }}
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={isTransferring || !transferToId}>
              {isTransferring ? 'Transferring...' : 'Transfer Ownership'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
