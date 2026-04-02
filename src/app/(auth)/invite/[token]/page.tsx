import { Suspense } from 'react'
import { AcceptInviteForm } from './AcceptInviteForm'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <AcceptInviteForm token={token} />
      </Suspense>
    </div>
  )
}
