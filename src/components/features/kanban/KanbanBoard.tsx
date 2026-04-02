'use client'

import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { KanbanColumn } from './KanbanColumn'
import { TaskModal } from './TaskModal'
import { getTasks, moveTask, getOrgMembers } from '@/lib/actions/tasks'
import {
  type Task,
  type TaskStatus,
  type TasksByStatus,
  TASK_STATUSES,
  groupTasksByStatus,
} from '@/types/tasks'

interface KanbanBoardProps {
  userRole: string
  currentUserId: string
}

export function KanbanBoard({ userRole, currentUserId }: KanbanBoardProps) {
  const [tasksByStatus, setTasksByStatus] = useState<TasksByStatus>({
    backlog: [],
    todo: [],
    in_progress: [],
    done: [],
  })
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<{ id: string; name: string; email: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'mine'>('all')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const loadTasks = useCallback(async () => {
    const result = await getTasks()
    if (result.success && result.data) {
      setAllTasks(result.data)
    }
  }, [])

  const loadMembers = useCallback(async () => {
    const result = await getOrgMembers()
    if (result.success && result.data) {
      setMembers(result.data)
    }
  }, [])

  useEffect(() => {
    Promise.all([loadTasks(), loadMembers()]).finally(() => setIsLoading(false))
  }, [loadTasks, loadMembers])

  // Filter and group tasks
  useEffect(() => {
    let filtered = allTasks
    if (filter === 'mine') {
      filtered = allTasks.filter((t) => t.assigneeId === currentUserId)
    }
    setTasksByStatus(groupTasksByStatus(filtered))
  }, [allTasks, filter, currentUserId])

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const newStatus = destination.droppableId as TaskStatus
    const task = allTasks.find((t) => t.id === draggableId)
    if (!task) return

    // Optimistic update
    const updatedTasks = allTasks.map((t) =>
      t.id === draggableId
        ? { ...t, status: newStatus, order: destination.index }
        : t
    )
    setAllTasks(updatedTasks)

    // API call
    const apiResult = await moveTask(draggableId, newStatus, destination.index)

    if (!apiResult.success) {
      // Rollback
      setAllTasks(allTasks)
      toast.error(apiResult.error?.message || 'Failed to move task')
      return
    }

    toast.success('Task moved')
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsCreating(false)
    setIsModalOpen(true)
  }

  const handleCreateClick = () => {
    setSelectedTask(null)
    setIsCreating(true)
    setIsModalOpen(true)
  }

  const handleTaskCreated = (task: Task) => {
    setAllTasks((prev) => [...prev, task])
  }

  const handleTaskUpdated = (task: Task) => {
    setAllTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
  }

  const handleTaskDeleted = (taskId: string) => {
    setAllTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as 'all' | 'mine')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="mine">My Tasks</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleCreateClick}>
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </Button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {TASK_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
      </DragDropContext>

      {/* Task Modal */}
      <TaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        task={isCreating ? null : selectedTask}
        members={members}
        userRole={userRole}
        currentUserId={currentUserId}
        onTaskCreated={handleTaskCreated}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  )
}
