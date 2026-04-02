'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { updateOrganization, deleteOrganization } from '@/lib/actions/settings'

interface OrganizationSettingsProps {
  organization: {
    id: string
    name: string
  }
  role: string
}

export function OrganizationSettings({ organization, role }: OrganizationSettingsProps) {
  const router = useRouter()
  const [orgName, setOrgName] = useState(organization.name)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const canEdit = role === 'owner' || role === 'admin'
  const canDelete = role === 'owner'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim() || !canEdit) return

    setIsSubmitting(true)

    try {
      const result = await updateOrganization({ name: orgName.trim() })

      if (!result.success) {
        toast.error(result.error?.message || 'Failed to update organization')
        return
      }

      toast.success('Organization updated')
      router.refresh()
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmation !== organization.name || !canDelete) return

    setIsDeleting(true)

    try {
      const result = await deleteOrganization()

      if (!result.success) {
        toast.error(result.error?.message || 'Failed to delete organization')
        return
      }

      toast.success('Organization deleted')
      router.push('/onboarding')
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Organization</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name"
              disabled={!canEdit}
              maxLength={100}
            />
            {!canEdit && (
              <p className="text-xs text-muted-foreground">
                Only admins can edit organization settings
              </p>
            )}
          </div>

          {canEdit && (
            <Button type="submit" disabled={isSubmitting || !orgName.trim()}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </form>
      </Card>

      {canDelete && (
        <Card className="p-6 border-destructive/50">
          <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting this organization will remove all data including metrics, tasks, and team members.
            This action cannot be undone.
          </p>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            Delete Organization
          </Button>
        </Card>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
            <DialogDescription>
              This will permanently delete the organization and all associated data.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <p className="text-sm">
              Type <strong>{organization.name}</strong> to confirm deletion:
            </p>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Organization name"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteConfirmation('')
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmation !== organization.name || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Organization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
