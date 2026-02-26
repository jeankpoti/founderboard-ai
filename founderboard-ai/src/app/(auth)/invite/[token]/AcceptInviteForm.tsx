'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { getInviteDetails, acceptInvitation } from '@/lib/actions/settings'

interface AcceptInviteFormProps {
  token: string
}

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const router = useRouter()
  const [inviteDetails, setInviteDetails] = useState<{
    orgName: string
    role: string
    email: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)

  useEffect(() => {
    async function loadInvite() {
      const result = await getInviteDetails(token)

      if (!result.success) {
        setError(result.error?.message || 'Invalid invitation')
        setIsLoading(false)
        return
      }

      setInviteDetails(result.data!)
      setIsLoading(false)
    }

    loadInvite()
  }, [token])

  const handleAccept = async () => {
    setIsAccepting(true)

    try {
      const result = await acceptInvitation(token)

      if (!result.success) {
        if (result.error?.code === 'AUTH_REQUIRED') {
          // Redirect to login with return URL
          router.push(`/login?redirect=/invite/${token}`)
          return
        }
        toast.error(result.error?.message || 'Failed to accept invitation')
        return
      }

      toast.success('Welcome to the team!')
      router.push('/dashboard')
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsAccepting(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invalid Invitation</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/login')} className="w-full">
            Go to Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Join {inviteDetails?.orgName}</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join as a {inviteDetails?.role}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">Invitation for:</p>
          <p className="font-medium">{inviteDetails?.email}</p>
        </div>

        <Button onClick={handleAccept} className="w-full" disabled={isAccepting}>
          {isAccepting ? 'Accepting...' : 'Accept Invitation'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By accepting, you&apos;ll join {inviteDetails?.orgName} and have access to shared data.
        </p>
      </CardContent>
    </Card>
  )
}
