/**
 * Activity Server Actions
 *
 * This file contains server-side functions for managing activities.
 *
 * WHAT ARE SERVER ACTIONS?
 * - Server actions run on the server, not in the browser
 * - They have access to the database and sensitive data
 * - The 'use server' directive at the top marks this as server-only code
 *
 * WHY SERVER ACTIONS?
 * - Security: Database credentials stay on the server
 * - Performance: Heavy operations don't slow down the browser
 * - Next.js Feature: Server actions can be called directly from React components
 */
'use server'

// Import Firebase admin SDK for server-side database access
import { adminDb } from '@/lib/firebase/admin'

// Import our collection name constants
import { COLLECTIONS } from '@/lib/firebase/collections'

// Import auth helper to get current user and organization
import { getOrgContext } from '@/lib/auth/org-context'

// Import our validation schema
import { createActivitySchema } from '@/types/activity'

// Import TypeScript types
import type { ApiResponse } from '@/types/api'
import type { Activity, CreateActivityInput } from '@/types/activity'

// ========================================
// GET ACTIVITIES
// ========================================

/**
 * Fetches all activities for the current organization.
 *
 * FUNCTION BREAKDOWN:
 * - "export" means this function can be used in other files
 * - "async" means this function can wait for things (like database queries)
 * - "Promise<ApiResponse<Activity[]>>" means it returns a promise that resolves to either success or error
 *
 * @param limit - How many activities to fetch (default 50)
 * @returns List of activities or an error
 */
export async function getActivities(
  limit: number = 50
): Promise<ApiResponse<Activity[]>> {
  try {
    // STEP 1: Check if user is logged in and has an organization
    // getOrgContext() returns info about the current user and their org
    const orgContext = await getOrgContext()

    // If no context, user isn't properly authenticated
    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    // STEP 2: Query the database
    // adminDb() gives us access to Firestore
    const db = adminDb()

    // Build the query:
    // - collection() = which collection to query
    // - where() = filter to only get this org's activities
    // - orderBy() = sort by creation date, newest first
    // - limit() = only get the first N results
    const snapshot = await db
      .collection(COLLECTIONS.ACTIVITIES)
      .where('orgId', '==', orgContext.organization.id)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    // STEP 3: Transform the database documents into our Activity type
    // snapshot.docs is an array of database documents
    // .map() transforms each document into the shape we want
    const activities = snapshot.docs.map((doc) => {
      const data = doc.data()

      return {
        id: doc.id, // Firestore document ID
        ...data, // Spread all the document fields
        // Ensure createdAt is a string (Firestore might return a Timestamp object)
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() ||
          data.createdAt ||
          new Date().toISOString(),
      }
    }) as Activity[]

    // STEP 4: Return success with the data
    return {
      success: true,
      data: activities,
    }
  } catch (error) {
    // STEP 5: Handle any errors
    // Always log errors for debugging
    console.error('Get activities error:', error)

    // Return a generic error to the client
    // (Don't expose internal error details for security)
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch activities',
      },
    }
  }
}

// ========================================
// CREATE ACTIVITY
// ========================================

/**
 * Creates a new activity record.
 *
 * NOTE: This function is typically called from other actions,
 * not directly from the UI. For example, when a task is created,
 * the createTask action calls this to log the activity.
 *
 * @param input - The activity data to create
 * @returns The created activity or an error
 */
export async function createActivity(
  input: CreateActivityInput
): Promise<ApiResponse<Activity>> {
  try {
    // STEP 1: Verify user is authenticated
    const orgContext = await getOrgContext()

    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    // STEP 2: Validate the input data
    // .safeParse() returns { success, data } or { success: false, error }
    const validation = createActivitySchema.safeParse(input)

    if (!validation.success) {
      // Get the first error message from Zod
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.error.issues[0]?.message || 'Invalid input',
        },
      }
    }

    // STEP 3: Build the activity document
    const db = adminDb()
    const now = new Date()

    // Create a reference to a new document (Firestore auto-generates the ID)
    const activityRef = db.collection(COLLECTIONS.ACTIVITIES).doc()

    // Build the activity data
    // Omit<Activity, 'id'> means "Activity type but without the id field"
    const activityData: Omit<Activity, 'id'> = {
      orgId: orgContext.organization.id,
      type: validation.data.type,
      // Actor = the person performing the action
      actorId: orgContext.user.uid,
      actorName: orgContext.user.displayName || 'Unknown',
      actorEmail: orgContext.user.email || '',
      // Target = what the action was performed on
      targetType: validation.data.targetType as Activity['targetType'],
      targetId: validation.data.targetId,
      targetName: validation.data.targetName,
      metadata: validation.data.metadata,
      createdAt: now.toISOString(),
    }

    // STEP 4: Save to database
    await activityRef.set(activityData)

    // STEP 5: Return the created activity
    return {
      success: true,
      data: {
        id: activityRef.id,
        ...activityData,
      } as Activity,
    }
  } catch (error) {
    console.error('Create activity error:', error)

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create activity',
      },
    }
  }
}

// ========================================
// HELPER: LOG ACTIVITY
// ========================================

/**
 * Helper function to log an activity from other actions.
 *
 * This is a simpler version of createActivity that doesn't return errors.
 * It's meant to be used within other actions where we don't want activity
 * logging failures to break the main operation.
 *
 * USAGE IN OTHER ACTIONS:
 *
 * // In tasks.ts
 * export async function createTask(input) {
 *   // ... create the task ...
 *
 *   // Log the activity (fire and forget)
 *   logActivity({
 *     type: 'task_created',
 *     targetType: 'task',
 *     targetId: task.id,
 *     targetName: task.title,
 *   })
 *
 *   return { success: true, data: task }
 * }
 *
 * @param input - Activity data to log
 */
export async function logActivity(input: CreateActivityInput): Promise<void> {
  try {
    // We call createActivity but don't await or check the result
    // This is "fire and forget" - we don't want activity logging
    // to slow down or break the main operation
    await createActivity(input)
  } catch (error) {
    // Just log the error, don't throw
    // Activity logging should never break the main operation
    console.error('Failed to log activity:', error)
  }
}

// ========================================
// GET ACTIVITIES FOR A SPECIFIC TARGET
// ========================================

/**
 * Gets activities related to a specific item (task, investor, etc.)
 *
 * This is useful for showing activity history on detail pages.
 * For example, on an investor detail page, show all activities
 * related to that investor.
 *
 * @param targetType - The type of target (e.g., 'investor', 'task')
 * @param targetId - The ID of the target
 * @param limit - How many activities to fetch
 * @returns Activities for the target or an error
 */
export async function getActivitiesForTarget(
  targetType: string,
  targetId: string,
  limit: number = 20
): Promise<ApiResponse<Activity[]>> {
  try {
    const orgContext = await getOrgContext()

    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    const db = adminDb()

    // Query activities filtered by target
    const snapshot = await db
      .collection(COLLECTIONS.ACTIVITIES)
      .where('orgId', '==', orgContext.organization.id)
      .where('targetType', '==', targetType)
      .where('targetId', '==', targetId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    const activities = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() ||
          data.createdAt ||
          new Date().toISOString(),
      }
    }) as Activity[]

    return {
      success: true,
      data: activities,
    }
  } catch (error) {
    console.error('Get activities for target error:', error)

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch activities',
      },
    }
  }
}

// ========================================
// GET ACTIVITIES BY USER
// ========================================

/**
 * Gets activities performed by a specific user.
 *
 * Useful for seeing what a team member has been working on.
 *
 * @param userId - The user's ID
 * @param limit - How many activities to fetch
 * @returns Activities by the user or an error
 */
export async function getActivitiesByUser(
  userId: string,
  limit: number = 20
): Promise<ApiResponse<Activity[]>> {
  try {
    const orgContext = await getOrgContext()

    if (!orgContext) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated or no organization selected',
        },
      }
    }

    const db = adminDb()

    // Query activities filtered by actor (user who performed the action)
    const snapshot = await db
      .collection(COLLECTIONS.ACTIVITIES)
      .where('orgId', '==', orgContext.organization.id)
      .where('actorId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    const activities = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() ||
          data.createdAt ||
          new Date().toISOString(),
      }
    }) as Activity[]

    return {
      success: true,
      data: activities,
    }
  } catch (error) {
    console.error('Get activities by user error:', error)

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch activities',
      },
    }
  }
}
