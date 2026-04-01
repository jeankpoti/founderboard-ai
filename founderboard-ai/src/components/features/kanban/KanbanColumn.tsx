'use client'

import { Droppable, Draggable } from '@hello-pangea/dnd'
import { Card } from '@/components/ui/card'
import { TaskCard } from './TaskCard'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types/tasks'
import { TASK_STATUS_LABELS } from '@/types/tasks'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  onTaskClick: (task: Task) => void
}

export function KanbanColumn({ status, tasks, onTaskClick }: KanbanColumnProps) {
  return (
    <div className="flex-1 min-w-[280px] max-w-[350px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{TASK_STATUS_LABELS[status]}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'min-h-[400px] p-2 transition-colors',
              snapshot.isDraggingOver && 'bg-primary/5 border-primary/20'
            )}
          >
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(draggableProvided, draggableSnapshot) => (
                    <div
                      ref={draggableProvided.innerRef}
                      {...draggableProvided.draggableProps}
                      {...draggableProvided.dragHandleProps}
                    >
                      <TaskCard
                        task={task}
                        onClick={() => onTaskClick(task)}
                        isDragging={draggableSnapshot.isDragging}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>

            {tasks.length === 0 && (
              <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">
                No tasks
              </div>
            )}
          </Card>
        )}
      </Droppable>
    </div>
  )
}
