import { toast } from 'sonner'

/**
 * Standard error codes used throughout the application
 */
export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'

/**
 * Maps error codes to user-friendly messages
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  UNAUTHORIZED: 'Please sign in to continue.',
  FORBIDDEN: 'You don\'t have permission to do this.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
}

/**
 * Application error class with code and user-friendly message
 */
export class AppError extends Error {
  code: ErrorCode
  userMessage: string

  constructor(code: ErrorCode, message?: string) {
    super(message || ERROR_MESSAGES[code])
    this.code = code
    this.userMessage = ERROR_MESSAGES[code]
    this.name = 'AppError'
  }
}

/**
 * Handle an error by showing a toast and logging to console
 */
export function handleError(error: unknown, context?: string): void {
  // Log for debugging
  console.error(context ? `${context}:` : 'Error:', error)

  // Show user-friendly toast
  if (error instanceof AppError) {
    toast.error(error.userMessage)
  } else if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      toast.error(ERROR_MESSAGES.NETWORK_ERROR)
    } else {
      toast.error(ERROR_MESSAGES.INTERNAL_ERROR)
    }
  } else {
    toast.error(ERROR_MESSAGES.INTERNAL_ERROR)
  }
}

/**
 * Parse an API response and throw AppError if not successful
 */
export async function parseApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json()

  if (!response.ok || !data.success) {
    const code = mapStatusToErrorCode(response.status)
    throw new AppError(code, data.error?.message)
  }

  return data.data as T
}

/**
 * Map HTTP status codes to error codes
 */
function mapStatusToErrorCode(status: number): ErrorCode {
  switch (status) {
    case 401:
      return 'UNAUTHORIZED'
    case 403:
      return 'FORBIDDEN'
    case 404:
      return 'NOT_FOUND'
    case 422:
      return 'VALIDATION_ERROR'
    case 429:
      return 'RATE_LIMITED'
    default:
      return 'INTERNAL_ERROR'
  }
}

/**
 * Show a success toast notification
 */
export function showSuccess(message: string): void {
  toast.success(message)
}

/**
 * Show an error toast notification
 */
export function showError(message: string): void {
  toast.error(message)
}

/**
 * Show an info toast notification
 */
export function showInfo(message: string): void {
  toast.info(message)
}
