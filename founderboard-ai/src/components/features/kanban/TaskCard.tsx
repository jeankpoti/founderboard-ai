'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/tasks'

interface TaskCardProps {
  task: Task
  onClick: () => void
  isDragging?: boolean
}

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  return (
    <Card
      className={cn(
        'p-3 cursor-pointer hover:shadow-md transition-shadow',
        isDragging && 'shadow-lg rotate-2 scale-105'
      )}
      onClick={onClick}
    >
      <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {task.description}
        </p>
      )}
      {task.assigneeName && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-[10px] font-medium text-primary">
              {task.assigneeName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-muted-foreground truncate">
            {task.assigneeName}
          </span>
        </div>
      )}
    </Card>
  )
}
