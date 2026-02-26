import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(50, 'Organization name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s-]+$/, 'Organization name can only contain letters, numbers, spaces, and hyphens'),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
