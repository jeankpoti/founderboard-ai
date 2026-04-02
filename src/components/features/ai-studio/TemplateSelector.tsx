'use client'

import { Card } from '@/components/ui/card'
import { TEMPLATES, type TemplateType } from '@/types/ai'
import { cn } from '@/lib/utils'

interface TemplateSelectorProps {
  selected: TemplateType
  onSelect: (template: TemplateType) => void
}

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">Templates</h3>
      <div className="space-y-2">
        {TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className={cn(
              'p-3 cursor-pointer transition-colors hover:bg-muted/50',
              selected === template.id && 'border-primary bg-primary/5'
            )}
            onClick={() => onSelect(template.id)}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{template.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{template.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {template.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
