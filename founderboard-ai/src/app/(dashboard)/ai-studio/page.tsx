import { redirect } from 'next/navigation'
import { getOrgContext } from '@/lib/auth/org-context'
import { AIStudio } from '@/components/features/ai-studio'

export default async function AIStudioPage() {
  const orgContext = await getOrgContext()

  if (!orgContext) {
    redirect('/onboarding')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Content Studio</h1>
        <p className="text-muted-foreground">
          Generate investor updates, pitch decks, and social posts with AI
        </p>
      </div>

      <AIStudio />
    </div>
  )
}
