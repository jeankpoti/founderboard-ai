'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createTask, updateTask, deleteTask } from '@/lib/actions/tasks'
import type { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from '@/types/tasks'
import { TASK_STATUS_LABELS, TASK_STATUSES } from '@/types/tasks'

interface OrgMember {
  id: string
  name: string
  email: string
}

interface TaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  members: OrgMember[]
  userRole: string
  currentUserId: string
  onTaskCreated?: (task: Task) => void
  onTaskUpdated?: (task: Task) => void
  onTaskDeleted?: (taskId: string) => void
}

export function TaskModal({
  open,
  onOpenChange,
  task,
  members,
  userRole,
  currentUserId,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
}: TaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('backlog')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isEditing = !!task
  const isReadOnly =
    userRole === 'member' && !!task && task.assigneeId !== currentUserId
  const canDelete = userRole === 'owner' || userRole === 'admin'

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setStatus(task.status)
      setAssigneeId(task.assigneeId || '')
    } else {
      setTitle('')
      setDescription('')
      setStatus('backlog')
      setAssigneeId('')
    }
  }, [task, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || isReadOnly) return

    setIsSubmitting(true)

    try {
      if (isEditing && task) {
        const input: UpdateTaskInput = {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          assigneeId: assigneeId || null,
        }
        const result = await updateTask(task.id, input)

        if (!result.success) {
          toast.error(result.error?.message || 'Failed to update task')
          return
        }

        toast.success('Task updated')
        onTaskUpdated?.(result.data!)
      } else {
        const input: CreateTaskInput = {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          assigneeId: assigneeId || undefined,
        }
        const result = await createTask(input)

        if (!result.success) {
          toast.error(result.error?.message || 'Failed to create task')
          return
        }

        toast.success('Task created')
        onTaskCreated?.(result.data!)
      }

      onOpenChange(false)
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!task || !canDelete) return

    setIsDeleting(true)

    try {
      const result = await deleteTask(task.id)

      if (!result.success) {
        toast.error(result.error?.message || 'Failed to delete task')
        return
      }

      toast.success('Task deleted')
      onTaskDeleted?.(task.id)
      onOpenChange(false)
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? (isReadOnly ? 'View Task' : 'Edit Task') : 'Create Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              disabled={isReadOnly}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description (optional)"
              className="w-full min-h-[80px] p-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isReadOnly}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TASK_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={assigneeId}
                onValueChange={setAssigneeId}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {isEditing && canDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className="mr-auto"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isDeleting}
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={isSubmitting || isDeleting || !title.trim()}>
                {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Task'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
