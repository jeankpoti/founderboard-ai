import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { getOrgContext } from '@/lib/auth/org-context'
import { checkAIRateLimit } from '@/lib/rate-limit'
import { getTemplate, type TemplateType } from '@/types/ai'
import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import type { Metric } from '@/types/metrics'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    // Verify authentication and org context
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check rate limit
    const rateLimit = await checkAIRateLimit(
      orgContext.user.uid,
      orgContext.organization.id
    )

    if (!rateLimit.success) {
      return new Response(
        JSON.stringify({ error: rateLimit.error }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { prompt, template: templateId } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get template
    const template = getTemplate(templateId as TemplateType || 'custom')

    // Fetch org metrics for context
    const metricsContext = await getMetricsContext(orgContext.organization.id)

    // Build system prompt with metrics context
    const systemPrompt = `${template.systemPrompt}

${metricsContext ? `
CURRENT METRICS FOR ${orgContext.organization.name}:
${metricsContext}

Use these actual numbers in your response where relevant.
` : ''}

Organization: ${orgContext.organization.name}
Date: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`

    // Stream the response
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      prompt,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('AI generation error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate content' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function getMetricsContext(orgId: string): Promise<string | null> {
  try {
    const db = adminDb()
    const snapshot = await db
      .collection(COLLECTIONS.METRICS)
      .where('orgId', '==', orgId)
      .get()

    if (snapshot.empty) return null

    const metrics: string[] = []

    snapshot.docs.forEach((doc) => {
      const data = doc.data() as Metric
      switch (data.type) {
        case 'mrr':
          metrics.push(`- MRR: $${data.value.toLocaleString()}${data.previousValue ? ` (was $${data.previousValue.toLocaleString()})` : ''}`)
          break
        case 'users':
          metrics.push(`- Active Users: ${data.value.toLocaleString()}${data.previousValue ? ` (was ${data.previousValue.toLocaleString()})` : ''}`)
          break
        case 'churn':
          metrics.push(`- Churn Rate: ${data.value}%${data.previousValue ? ` (was ${data.previousValue}%)` : ''}`)
          break
        case 'conversions':
          metrics.push(`- Trial Conversion: ${data.value}%${data.previousValue ? ` (was ${data.previousValue}%)` : ''}`)
          break
      }
    })

    return metrics.length > 0 ? metrics.join('\n') : null
  } catch (error) {
    console.error('Failed to fetch metrics context:', error)
    return null
  }
}
