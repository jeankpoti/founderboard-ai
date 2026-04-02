'use server'

/**
 * Templates Server Actions
 *
 * Server-side functions for managing templates.
 *
 * WHAT ARE TEMPLATES?
 * Templates are reusable content structures with placeholders.
 * Users can create notes, documents, or emails from templates
 * by filling in the variable values.
 *
 * WORKFLOW:
 * 1. Create template with {{placeholder}} syntax
 * 2. User selects template and fills in values
 * 3. System generates final content with values applied
 */

import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { getOrgContext } from '@/lib/auth/org-context'
import {
  createTemplateSchema,
  updateTemplateSchema,
  extractVariables,
  createDefaultVariables,
} from '@/types/templates'
import type { ApiResponse } from '@/types/api'
import type {
  Template,
  CreateTemplateInput,
  UpdateTemplateInput,
} from '@/types/templates'
import { logActivity } from './activity'

// ========================================
// GET TEMPLATES
// ========================================

/**
 * Get all templates for the organization.
 *
 * Returns both custom templates created by the team
 * and public templates shared with the org.
 */
export async function getTemplates(): Promise<ApiResponse<Template[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()

    // Get templates for this organization
    const snapshot = await db
      .collection(COLLECTIONS.TEMPLATES)
      .where('orgId', '==', orgContext.organization.id)
      .orderBy('name', 'asc')
      .get()

    const templates = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      }
    }) as Template[]

    return { success: true, data: templates }
  } catch (error) {
    console.error('Get templates error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch templates' },
    }
  }
}

/**
 * Get a single template by ID.
 */
export async function getTemplate(templateId: string): Promise<ApiResponse<Template>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    const doc = await db.collection(COLLECTIONS.TEMPLATES).doc(templateId).get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Template not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    const template: Template = {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as Template

    return { success: true, data: template }
  } catch (error) {
    console.error('Get template error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch template' },
    }
  }
}

// ========================================
// CREATE TEMPLATE
// ========================================

/**
 * Create a new template.
 *
 * Automatically extracts variables from {{placeholder}} syntax
 * in the content if variables are not explicitly provided.
 */
export async function createTemplate(
  input: CreateTemplateInput
): Promise<ApiResponse<Template>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    // Viewers cannot create templates
    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot create templates' },
      }
    }

    // Validate input
    const validation = createTemplateSchema.safeParse(input)
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
    const now = new Date().toISOString()

    // Get creator name
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(orgContext.user.uid).get()
    const createdByName = userDoc.exists ? userDoc.data()?.displayName : undefined

    // Extract variables from content if not provided
    let variables = validation.data.variables
    if (!variables || variables.length === 0) {
      const extractedNames = extractVariables(validation.data.content)
      variables = createDefaultVariables(extractedNames)
    }

    // Create template document
    const templateRef = db.collection(COLLECTIONS.TEMPLATES).doc()
    const templateData: Omit<Template, 'id'> = {
      orgId: orgContext.organization.id,
      name: validation.data.name,
      description: validation.data.description || '',
      category: validation.data.category,
      outputType: validation.data.outputType,
      content: validation.data.content,
      variables,
      isSystem: false, // User-created templates are never system templates
      isPublic: validation.data.isPublic,
      tags: validation.data.tags,
      usageCount: 0,
      createdBy: orgContext.user.uid,
      createdByName,
      createdAt: now,
      updatedAt: now,
    }

    await templateRef.set(templateData)

    // Log activity
    await logActivity({
      type: 'template_created',
      targetType: 'template',
      targetId: templateRef.id,
      targetName: validation.data.name,
    })

    return {
      success: true,
      data: { id: templateRef.id, ...templateData },
    }
  } catch (error) {
    console.error('Create template error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create template' },
    }
  }
}

// ========================================
// UPDATE TEMPLATE
// ========================================

/**
 * Update an existing template.
 *
 * NOTE: System templates cannot be modified.
 */
export async function updateTemplate(
  templateId: string,
  input: UpdateTemplateInput
): Promise<ApiResponse<Template>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot update templates' },
      }
    }

    // Validate input
    const validation = updateTemplateSchema.safeParse(input)
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
    const templateRef = db.collection(COLLECTIONS.TEMPLATES).doc(templateId)
    const doc = await templateRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Template not found' },
      }
    }

    const existingData = doc.data()!

    // Check ownership
    if (existingData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // System templates cannot be modified
    if (existingData.isSystem) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'System templates cannot be modified' },
      }
    }

    // Get editor name
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(orgContext.user.uid).get()
    const lastEditedByName = userDoc.exists ? userDoc.data()?.displayName : undefined

    // Re-extract variables if content changed
    let variables = validation.data.variables
    if (validation.data.content && !variables) {
      const extractedNames = extractVariables(validation.data.content)
      variables = createDefaultVariables(extractedNames)
    }

    // Update template
    const updateData: Partial<Template> = {
      ...validation.data,
      ...(variables && { variables }),
      lastEditedBy: orgContext.user.uid,
      lastEditedByName,
      updatedAt: new Date().toISOString(),
    }

    await templateRef.update(updateData)

    // Log activity
    await logActivity({
      type: 'template_updated',
      targetType: 'template',
      targetId: templateId,
      targetName: validation.data.name || existingData.name,
    })

    const updatedTemplate: Template = {
      ...existingData,
      ...updateData,
      id: templateId,
      createdAt: existingData.createdAt?.toDate?.()?.toISOString() || existingData.createdAt,
    } as Template

    return { success: true, data: updatedTemplate }
  } catch (error) {
    console.error('Update template error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update template' },
    }
  }
}

// ========================================
// DELETE TEMPLATE
// ========================================

/**
 * Delete a template.
 *
 * NOTE: System templates cannot be deleted.
 */
export async function deleteTemplate(templateId: string): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    // Only admins and owners can delete templates
    if (orgContext.role !== 'owner' && orgContext.role !== 'admin') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Only admins can delete templates' },
      }
    }

    const db = adminDb()
    const templateRef = db.collection(COLLECTIONS.TEMPLATES).doc(templateId)
    const doc = await templateRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Template not found' },
      }
    }

    const data = doc.data()!

    // Check ownership
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // System templates cannot be deleted
    if (data.isSystem) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'System templates cannot be deleted' },
      }
    }

    // Delete the template
    await templateRef.delete()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete template error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete template' },
    }
  }
}

// ========================================
// USE TEMPLATE
// ========================================

/**
 * Increment the usage count for a template.
 *
 * Called when a user creates content from a template.
 * Helps track which templates are most useful.
 */
export async function incrementTemplateUsage(
  templateId: string
): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    const db = adminDb()
    const templateRef = db.collection(COLLECTIONS.TEMPLATES).doc(templateId)
    const doc = await templateRef.get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Template not found' },
      }
    }

    const data = doc.data()!
    if (data.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Increment usage count
    await templateRef.update({
      usageCount: (data.usageCount || 0) + 1,
      updatedAt: new Date().toISOString(),
    })

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Increment template usage error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update usage count' },
    }
  }
}

// ========================================
// DUPLICATE TEMPLATE
// ========================================

/**
 * Create a copy of an existing template.
 *
 * Useful for creating variations of system templates
 * or making personal copies of team templates.
 */
export async function duplicateTemplate(
  templateId: string,
  newName?: string
): Promise<ApiResponse<Template>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated' },
      }
    }

    if (orgContext.role === 'viewer') {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Viewers cannot duplicate templates' },
      }
    }

    const db = adminDb()
    const doc = await db.collection(COLLECTIONS.TEMPLATES).doc(templateId).get()

    if (!doc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Template not found' },
      }
    }

    const existingData = doc.data()!
    if (existingData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Get creator name
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(orgContext.user.uid).get()
    const createdByName = userDoc.exists ? userDoc.data()?.displayName : undefined

    const now = new Date().toISOString()

    // Create new template as a copy
    const templateRef = db.collection(COLLECTIONS.TEMPLATES).doc()
    const templateData: Omit<Template, 'id'> = {
      orgId: orgContext.organization.id,
      name: newName || `${existingData.name} (Copy)`,
      description: existingData.description,
      category: existingData.category,
      outputType: existingData.outputType,
      content: existingData.content,
      variables: existingData.variables || [],
      isSystem: false, // Copies are never system templates
      isPublic: existingData.isPublic,
      tags: existingData.tags || [],
      usageCount: 0,
      createdBy: orgContext.user.uid,
      createdByName,
      createdAt: now,
      updatedAt: now,
    }

    await templateRef.set(templateData)

    return {
      success: true,
      data: { id: templateRef.id, ...templateData },
    }
  } catch (error) {
    console.error('Duplicate template error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to duplicate template' },
    }
  }
}
