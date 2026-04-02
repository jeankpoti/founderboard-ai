import { z } from 'zod'

// Task status types for Kanban columns
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done'

export const TASK_STATUSES: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'done']

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

// Task interface
export interface Task {
  id: string
  orgId: string
  title: string
  description?: string
  status: TaskStatus
  assigneeId?: string
  assigneeName?: string
  assigneeEmail?: string
  createdBy: string
  createdAt: string // ISO string for Server/Client Component compatibility
  updatedAt: string // ISO string for Server/Client Component compatibility
  order: number // For ordering within columns
}

// Task form data (for creating/editing)
export interface TaskFormData {
  title: string
  description?: string
  status?: TaskStatus
  assigneeId?: string
}

// Validation schemas
export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'done']).optional().default('backlog'),
  assigneeId: z.string().optional(),
})

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'done']).optional(),
  assigneeId: z.string().optional().nullable(),
  order: z.number().optional(),
})

// Type helpers
export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

// Grouped tasks by status for Kanban
export type TasksByStatus = Record<TaskStatus, Task[]>

// Helper to group tasks by status
export function groupTasksByStatus(tasks: Task[]): TasksByStatus {
  const grouped: TasksByStatus = {
    backlog: [],
    todo: [],
    in_progress: [],
    done: [],
  }

  tasks.forEach((task) => {
    grouped[task.status].push(task)
  })

  // Sort each column by order
  Object.keys(grouped).forEach((status) => {
    grouped[status as TaskStatus].sort((a, b) => a.order - b.order)
  })

  return grouped
}
