'use server'

import { adminDb } from '@/lib/firebase/admin'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { getOrgContext } from '@/lib/auth/org-context'
import type { ApiResponse } from '@/types/api'
import type { AIConversation, AIConversationMessage, TemplateType } from '@/types/ai'

// Helper to convert Firestore Timestamp to ISO string
function serializeTimestamp(timestamp: unknown): string {
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return (timestamp as { toDate: () => Date }).toDate().toISOString()
  }
  if (timestamp && typeof timestamp === 'object' && '_seconds' in timestamp) {
    return new Date((timestamp as { _seconds: number })._seconds * 1000).toISOString()
  }
  return new Date().toISOString()
}

export async function createConversation(
  template: TemplateType
): Promise<ApiResponse<AIConversation>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated or no organization selected' },
      }
    }

    const db = adminDb()
    const now = new Date().toISOString()
    const conversationRef = db.collection(COLLECTIONS.AI_CONVERSATIONS).doc()

    const conversation: AIConversation = {
      id: conversationRef.id,
      orgId: orgContext.organization.id,
      userId: orgContext.user.uid,
      template,
      title: 'New Chat',
      createdAt: now,
      updatedAt: now,
    }

    await conversationRef.set(conversation)

    return { success: true, data: conversation }
  } catch (error) {
    console.error('Create conversation error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create conversation' },
    }
  }
}

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<ApiResponse<AIConversationMessage>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated or no organization selected' },
      }
    }

    const db = adminDb()
    const now = new Date().toISOString()

    // Verify conversation belongs to user's org
    const conversationRef = db.collection(COLLECTIONS.AI_CONVERSATIONS).doc(conversationId)
    const conversationDoc = await conversationRef.get()

    if (!conversationDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' },
      }
    }

    const conversationData = conversationDoc.data() as AIConversation
    if (conversationData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Create message
    const messageRef = db.collection(COLLECTIONS.AI_MESSAGES).doc()
    const message: AIConversationMessage = {
      id: messageRef.id,
      conversationId,
      role,
      content,
      timestamp: now,
    }

    // Update conversation title if first user message
    const batch = db.batch()
    batch.set(messageRef, message)

    // Update conversation's updatedAt and title (if first message)
    const updateData: Partial<AIConversation> = { updatedAt: now }
    if (role === 'user' && conversationData.title === 'New Chat') {
      // Use first 50 chars of first message as title
      updateData.title = content.slice(0, 50) + (content.length > 50 ? '...' : '')
    }
    batch.update(conversationRef, updateData)

    await batch.commit()

    return { success: true, data: message }
  } catch (error) {
    console.error('Save message error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to save message' },
    }
  }
}

export async function getConversations(): Promise<ApiResponse<AIConversation[]>> {
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
      .collection(COLLECTIONS.AI_CONVERSATIONS)
      .where('orgId', '==', orgContext.organization.id)
      .where('userId', '==', orgContext.user.uid)
      .orderBy('updatedAt', 'desc')
      .limit(50)
      .get()

    const conversations = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        orgId: data.orgId,
        userId: data.userId,
        template: data.template,
        title: data.title,
        createdAt: serializeTimestamp(data.createdAt),
        updatedAt: serializeTimestamp(data.updatedAt),
      } as AIConversation
    })

    return { success: true, data: conversations }
  } catch (error) {
    console.error('Get conversations error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch conversations' },
    }
  }
}

export async function getConversationMessages(
  conversationId: string
): Promise<ApiResponse<AIConversationMessage[]>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated or no organization selected' },
      }
    }

    const db = adminDb()

    // Verify conversation belongs to user's org
    const conversationDoc = await db
      .collection(COLLECTIONS.AI_CONVERSATIONS)
      .doc(conversationId)
      .get()

    if (!conversationDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' },
      }
    }

    const conversationData = conversationDoc.data() as AIConversation
    if (conversationData.orgId !== orgContext.organization.id) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Fetch messages
    const snapshot = await db
      .collection(COLLECTIONS.AI_MESSAGES)
      .where('conversationId', '==', conversationId)
      .orderBy('timestamp', 'asc')
      .get()

    const messages = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        timestamp: serializeTimestamp(data.timestamp),
      } as AIConversationMessage
    })

    return { success: true, data: messages }
  } catch (error) {
    console.error('Get conversation messages error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch messages' },
    }
  }
}

export async function deleteConversation(
  conversationId: string
): Promise<ApiResponse<void>> {
  try {
    const orgContext = await getOrgContext()
    if (!orgContext) {
      return {
        success: false,
        error: { code: 'AUTH_REQUIRED', message: 'Not authenticated or no organization selected' },
      }
    }

    const db = adminDb()

    // Verify conversation belongs to user
    const conversationRef = db.collection(COLLECTIONS.AI_CONVERSATIONS).doc(conversationId)
    const conversationDoc = await conversationRef.get()

    if (!conversationDoc.exists) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' },
      }
    }

    const conversationData = conversationDoc.data() as AIConversation
    if (conversationData.orgId !== orgContext.organization.id ||
        conversationData.userId !== orgContext.user.uid) {
      return {
        success: false,
        error: { code: 'PERMISSION_DENIED', message: 'Access denied' },
      }
    }

    // Delete all messages in conversation
    const messagesSnapshot = await db
      .collection(COLLECTIONS.AI_MESSAGES)
      .where('conversationId', '==', conversationId)
      .get()

    const batch = db.batch()
    messagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref)
    })
    batch.delete(conversationRef)

    await batch.commit()

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete conversation error:', error)
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete conversation' },
    }
  }
}
