import { create } from 'zustand'
import { toast } from 'sonner'

type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done'

interface Task {
  id: string
  orgId: string
  title: string
  description: string
  status: TaskStatus
  assigneeId: string | null
  order: number
  createdAt: Date
  updatedAt: Date
}

interface TasksState {
  tasks: Task[]
  isLoading: boolean
  error: string | null

  // Actions
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void
  moveTask: (id: string, status: TaskStatus, order: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState = {
  tasks: [],
  isLoading: true,
  error: null,
}

export const useTasksStore = create<TasksState>((set, get) => ({
  ...initialState,

  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
  moveTask: (id, status, order) => {
    const previous = get().tasks.find((t) => t.id === id)

    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status, order, updatedAt: new Date() } : t
      ),
    }))

    // Note: Actual Firestore update will be handled by the calling component
    // On failure, rollback using the previous state
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}))
