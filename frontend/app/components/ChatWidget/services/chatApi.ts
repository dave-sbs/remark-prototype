import type {
  MessagesResponse,
  OnboardingData,
  OnboardingResponse,
  ApiError,
} from '../types'

/**
 * Chat API Service
 *
 * Centralized service for all chat-related API calls.
 * Provides proper error handling and type safety.
 */

class ChatApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ChatApiError'
  }
}

/**
 * Load messages for a specific thread
 */
export async function loadMessages(
  threadId: string
): Promise<MessagesResponse> {
  try {
    const response = await fetch(`/api/chat/messages?threadId=${threadId}`)

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new ChatApiError(
        error.message || 'Failed to load messages',
        response.status,
        error
      )
    }

    const data: MessagesResponse = await response.json()
    return data
  } catch (error) {
    if (error instanceof ChatApiError) {
      throw error
    }
    throw new ChatApiError(
      'Network error while loading messages',
      undefined,
      error
    )
  }
}

/**
 * Save onboarding data for a thread
 */
export async function saveOnboarding(
  data: OnboardingData
): Promise<OnboardingResponse> {
  try {
    const response = await fetch('/api/chat/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error: ApiError = await response.json()
      throw new ChatApiError(
        error.message || 'Failed to save onboarding data',
        response.status,
        error
      )
    }

    const result: OnboardingResponse = await response.json()
    return result
  } catch (error) {
    if (error instanceof ChatApiError) {
      throw error
    }
    throw new ChatApiError(
      'Network error while saving onboarding data',
      undefined,
      error
    )
  }
}

/**
 * Type guard for API errors
 */
export function isChatApiError(error: unknown): error is ChatApiError {
  return error instanceof ChatApiError
}

/**
 * Export the error class for custom error handling
 */
export { ChatApiError }
