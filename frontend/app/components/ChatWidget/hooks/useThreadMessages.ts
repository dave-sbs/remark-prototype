'use client'

import { useState, useEffect, useCallback } from 'react'
import { UIMessage } from 'ai'
import { loadMessages } from '../services/chatApi'
import type { UseThreadMessagesReturn } from '../types'

/**
 * Thread Messages Hook
 *
 * Manages loading messages from the database for a given thread.
 * Provides proper error handling and loading states.
 *
 * Features:
 * - Automatic message loading on threadId change
 * - Error handling with retry capability
 * - Loading state management
 * - Manual refetch support
 */
export function useThreadMessages(threadId: string): UseThreadMessagesReturn {
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch messages for the current thread
   */
  const fetchMessages = useCallback(async () => {
    if (!threadId) {
      setMessages([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await loadMessages(threadId)
      setMessages(data.messages || [])
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load messages')
      setError(error)
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }, [threadId])

  /**
   * Manual refetch function for retry capability
   */
  const refetch = useCallback(async () => {
    await fetchMessages()
  }, [fetchMessages])

  /**
   * Load messages when threadId changes
   */
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  return {
    messages,
    isLoading,
    error,
    refetch,
  }
}
