'use server'

import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { getOrgContext } from '@/lib/auth/org-context'
import { createTaskSchema, updateTaskSchema } from '@/types/tasks'
import type { ApiResponse } from '@/types/api'
import type { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from '@/types/tasks'

export async function getTasks(): Promise<ApiResponse<Task[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated or no organization selected' },
      }
    }

    const db = adminDb()
    const snapshot = await db
      .collection(COLLECTIONS.TASKS)
      .where('orgId', '==', orgContext.organization.id)
      .orderBy('order', 'asc')
      .get()

    const tasks = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: (data.createdAt?.toDate?.() || new Date(data.createdAt)).toISOString(),
        updatedAt: (data.updatedAt?.toDate?.() || new Date(data.updatedAt)).toISOString(),
      }
    }) as Task[]

    return {
      success: true,
      data: tasks,
    }
  } catch (error) {
    console.error('Get tasks error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tasks' },
    }
  }
}

export async function createTask(input: CreateTaskInput): Promise<ApiResponse<Task>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated or no organization selected' },
      }
    }

    // Members can create tasks
    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot create tasks' },
      }
    }

    const validation = createTaskSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0]?.message || 'Invalid input',
        },
      }
    }

    const { title, description, status, assigneeId } = validation.data
    const db = adminDb()
    const now = new Date()

    // Get the max order for the status column
    const maxOrderSnapshot = await db
      .collection(COLLECTIONS.TASKS)
      .where('orgId', '==', orgContext.organization.id)
      .where('status', '==', status || 'backlog')
      .orderBy('order', 'desc')
      .limit(1)
      .get()

    const maxOrder = maxOrderSnapshot.empty ? 0 : (maxOrderSnapshot.docs[0].data().order || 0) + 1

    // Get assignee details if assigned
    let assigneeName: string | undefined
    let assigneeEmail: string | undefined
    if (assigneeId) {
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(assigneeId).get()
      if (userDoc.exists) {
        const userData = userDoc.data()
        assigneeName = userData?.displayName || undefined
        assigneeEmail = userData?.email || undefined
      }
    }

    const taskRef = db.collection(COLLECTIONS.TASKS).doc()
    const taskData: Omit<Task, 'id'> = {
      orgId: orgContext.organization.id,
      title,
      description,
      status: status || 'backlog',
      assigneeId,
      assigneeName,
      assigneeEmail,
      createdBy: orgContext.user.uid,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      order: maxOrder,
    }

    await taskRef.set(taskData)

    return {
      success: true,
      data: { id: taskRef.id, ...taskData } as Task,
    }
  } catch (error) {
    console.error('Create task error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create task' },
    }
  }
}

export async function updateTask(
  taskId: string,
  input: UpdateTaskInput
): Promise<ApiResponse<Task>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated or no organization selected' },
      }
    }

    const validation = updateTaskSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0]?.message || 'Invalid input',
        },
      }
    }

    const db = adminDb()
    const taskRef = db.collection(COLLECTIONS.TASKS).doc(taskId)
    const taskDoc = await taskRef.get()

    if (!taskDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' },
      }
    }

    const existingTask = taskDoc.data() as Task

    // Verify task belongs to user's org
    if (existingTask.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Members can only edit their own tasks
    if (orgContext.role === 'member' && existingTask.assigneeId !== orgContext.user.uid) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'You can only edit tasks assigned to you' },
      }
    }

    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot edit tasks' },
      }
    }

    const updateData: Partial<Task> = {
      updatedAt: new Date().toISOString(),
    }

    if (validation.data.title !== undefined) {
      updateData.title = validation.data.title
    }
    if (validation.data.description !== undefined) {
      updateData.description = validation.data.description
    }
    if (validation.data.status !== undefined) {
      updateData.status = validation.data.status
    }
    if (validation.data.order !== undefined) {
      updateData.order = validation.data.order
    }
    if (validation.data.assigneeId !== undefined) {
      if (validation.data.assigneeId === null) {
        updateData.assigneeId = undefined
        updateData.assigneeName = undefined
        updateData.assigneeEmail = undefined
      } else {
        updateData.assigneeId = validation.data.assigneeId
        // Get assignee details
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(validation.data.assigneeId).get()
        if (userDoc.exists) {
          const userData = userDoc.data()
          updateData.assigneeName = userData?.displayName || undefined
          updateData.assigneeEmail = userData?.email || undefined
        }
      }
    }

    await taskRef.update(updateData)

    // Serialize timestamps from existingTask
    const serializedExisting = {
      ...existingTask,
      createdAt: existingTask.createdAt?.toDate?.()
        ? existingTask.createdAt.toDate().toISOString()
        : existingTask.createdAt,
      updatedAt: existingTask.updatedAt?.toDate?.()
        ? existingTask.updatedAt.toDate().toISOString()
        : existingTask.updatedAt,
    }

    const updatedTask = {
      ...serializedExisting,
      ...updateData,
      id: taskId,
    } as Task

    return {
      success: true,
      data: updatedTask,
    }
  } catch (error) {
    console.error('Update task error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update task' },
    }
  }
}

export async function deleteTask(taskId: string): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated or no organization selected' },
      }
    }

    const db = adminDb()
    const taskRef = db.collection(COLLECTIONS.TASKS).doc(taskId)
    const taskDoc = await taskRef.get()

    if (!taskDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' },
      }
    }

    const existingTask = taskDoc.data() as Task

    // Verify task belongs to user's org
    if (existingTask.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Only admins/owners can delete tasks
    if (orgContext.role !== 'owner' && orgContext.role !== 'admin') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can delete tasks' },
      }
    }

    await taskRef.delete()

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('Delete task error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete task' },
    }
  }
}

export async function moveTask(
  taskId: string,
  newStatus: TaskStatus,
  newOrder: number
): Promise<ApiResponse<Task>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated or no organization selected' },
      }
    }

    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot move tasks' },
      }
    }

    const db = adminDb()
    const taskRef = db.collection(COLLECTIONS.TASKS).doc(taskId)
    const taskDoc = await taskRef.get()

    if (!taskDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Task not found' },
      }
    }

    const existingTask = taskDoc.data() as Task

    if (existingTask.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Members can move any task (common workflow need)
    const updateData: Partial<Task> = {
      status: newStatus,
      order: newOrder,
      updatedAt: new Date().toISOString(),
    }

    await taskRef.update(updateData)

    // Serialize timestamps from existingTask
    const serializedExisting = {
      ...existingTask,
      createdAt: existingTask.createdAt?.toDate?.()
        ? existingTask.createdAt.toDate().toISOString()
        : existingTask.createdAt,
      updatedAt: existingTask.updatedAt?.toDate?.()
        ? existingTask.updatedAt.toDate().toISOString()
        : existingTask.updatedAt,
    }

    return {
      success: true,
      data: { ...serializedExisting, ...updateData, id: taskId } as Task,
    }
  } catch (error) {
    console.error('Move task error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to move task' },
    }
  }
}

export async function getOrgMembers(): Promise<
  ApiResponse<{ id: string; name: string; email: string }[]>
> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated or no organization selected' },
      }
    }

    const db = adminDb()

    // Get all memberships for this org
    const membershipsSnapshot = await db
      .collection(COLLECTIONS.MEMBERSHIPS)
      .where('orgId', '==', orgContext.organization.id)
      .get()

    const members: { id: string; name: string; email: string }[] = []

    for (const membershipDoc of membershipsSnapshot.docs) {
      const membership = membershipDoc.data()
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(membership.userId).get()

      if (userDoc.exists) {
        const userData = userDoc.data()
        members.push({
          id: membership.userId,
          name: userData?.displayName || 'Unknown',
          email: userData?.email || '',
        })
      }
    }

    return {
      success: true,
      data: members,
    }
  } catch (error) {
    console.error('Get org members error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch members' },
    }
  }
}
