'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createOrganization } from '@/lib/actions/organization'
import { createOrganizationSchema, type CreateOrganizationInput } from '@/lib/validations/organization'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function CreateOrgForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof CreateOrganizationInput, string>>>({})

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      name: formData.get('name') as string,
    }

    // Validate with Zod
    const validation = createOrganizationSchema.safeParse(data)
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof CreateOrganizationInput, string>> = {}
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof CreateOrganizationInput
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      setIsLoading(false)
      return
    }

    try {
      const result = await createOrganization(validation.data)

      if (!result.success) {
        toast.error(result.error.message)
        setIsLoading(false)
        return
      }

      toast.success('Organization created!')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Create org error:', error)
      toast.error('Failed to create organization. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Organization Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="My Startup"
          required
          disabled={isLoading}
          autoFocus
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
        <p className="text-xs text-muted-foreground">
          This is the name of your startup or company.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Organization'}
      </Button>
    </form>
  )
}
