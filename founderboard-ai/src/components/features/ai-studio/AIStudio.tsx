'use client'

import { useState } from 'react'
import { TemplateSelector } from './TemplateSelector'
import { AIChat } from './AIChat'
import { type TemplateType } from '@/types/ai'

export function AIStudio() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('investor-update')

  return (
    <div className="flex gap-6 h-[calc(100vh-12rem)]">
      {/* Sidebar - Templates */}
      <div className="w-64 flex-shrink-0">
        <TemplateSelector
          selected={selectedTemplate}
          onSelect={setSelectedTemplate}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0">
        <AIChat key={selectedTemplate} template={selectedTemplate} />
      </div>
    </div>
  )
}
