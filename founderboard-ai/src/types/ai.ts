export type TemplateType = 'investor-update' | 'pitch-deck' | 'social-post' | 'custom'

export interface Template {
  id: TemplateType
  name: string
  description: string
  icon: string
  systemPrompt: string
  placeholders?: string[]
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface AIGeneration {
  id: string
  orgId: string
  userId: string
  template: TemplateType
  prompt: string
  response: string
  createdAt: Date
}

// Persistent conversation types
export interface AIConversation {
  id: string
  orgId: string
  userId: string
  template: TemplateType
  title: string
  createdAt: string
  updatedAt: string
}

export interface AIConversationMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export const TEMPLATES: Template[] = [
  {
    id: 'investor-update',
    name: 'Investor Update',
    description: 'Generate a professional monthly investor update',
    icon: '📊',
    systemPrompt: `You are a startup communications expert. Generate a professional investor update email.
Structure it with:
1. **Headline Metrics** - Key numbers (MRR, users, growth)
2. **Key Wins** - Top 3 achievements this month
3. **Challenges** - Honest assessment of obstacles
4. **Focus Areas** - What you're working on next
5. **The Ask** - How investors can help

Use the provided metrics data. Be concise, professional, and data-driven.`,
  },
  {
    id: 'pitch-deck',
    name: 'Pitch Deck Outline',
    description: 'Create a structured pitch deck outline',
    icon: '🎯',
    systemPrompt: `You are a pitch deck expert who has helped startups raise millions.
Generate a compelling pitch deck outline with:
1. **Problem** - Clear pain point
2. **Solution** - Your product/service
3. **Market Size** - TAM/SAM/SOM
4. **Business Model** - How you make money
5. **Traction** - Key metrics and milestones
6. **Team** - Why you'll win
7. **Ask** - Funding amount and use of funds

Include specific talking points for each slide. Use the metrics provided.`,
  },
  {
    id: 'social-post',
    name: 'Social Media Post',
    description: 'Generate engaging social media content',
    icon: '📱',
    systemPrompt: `You are a social media expert for B2B startups.
Generate engaging social media posts:
- For LinkedIn: Professional, story-driven, with clear takeaways
- For Twitter/X: Concise, punchy, with hooks

Include relevant emojis where appropriate. Make it authentic and avoid corporate speak.
Generate 2-3 variations the user can choose from.`,
  },
  {
    id: 'custom',
    name: 'Custom Prompt',
    description: 'Write your own prompt',
    icon: '✨',
    systemPrompt: `You are a helpful AI assistant for startup founders.
Help with any content, strategy, or communication task.
Be concise, practical, and actionable.`,
  },
]

export function getTemplate(id: TemplateType): Template {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[3]
}
