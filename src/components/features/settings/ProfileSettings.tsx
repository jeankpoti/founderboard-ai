'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { updateProfile } from '@/lib/actions/settings'

interface ProfileSettingsProps {
  user: {
    uid: string
    email: string
    displayName: string
  }
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim()) return

    setIsSubmitting(true)

    try {
      const result = await updateProfile({ displayName: displayName.trim() })

      if (!result.success) {
        toast.error(result.error?.message || 'Failed to update profile')
        return
      }

      toast.success('Profile updated')
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Profile</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={100}
          />
        </div>

        <Button type="submit" disabled={isSubmitting || !displayName.trim()}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Card>
  )
}
