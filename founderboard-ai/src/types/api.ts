// Standard API response wrapper
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError }

export interface ApiError {
  code: ErrorCode
  message: string
}

// Error codes in SCREAMING_SNAKE_CASE
export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'
  | 'ALREADY_EXISTS'
  | 'INVALID_STATE'

// Helper to create success response
export function success<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

// Helper to create error response
export function error<T>(code: ErrorCode, message: string): ApiResponse<T> {
  return { success: false, error: { code, message } }
}
