'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { CHAT_INPUT } from '../constants'
import type { UseChatInputReturn } from '../types'

/**
 * Chat Input Hook
 *
 * Manages chat input state, auto-resize functionality, and submission handling.
 *
 * Features:
 * - Auto-resize textarea based on content
 * - Submission state management
 * - Keyboard shortcuts (Enter to submit, Shift+Enter for newline)
 * - Proper cleanup and reset
 */
export function useChatInput(
  onSubmit: (text: string) => Promise<void>,
  updateActivity: () => void
): UseChatInputReturn {
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fallbackInputRef = useRef('')

  /**
   * Reset textarea height when input is empty
   */
  useEffect(() => {
    if (input === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [input])

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)
      fallbackInputRef.current = input
      setInput('')

      // Submit the message
      await onSubmit(input)

      // Update activity timestamp
      updateActivity()
    } catch (error) {
      // Restore input on error
      setInput(fallbackInputRef.current)
      console.error('[useChatInput] Failed to send message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [input, isSubmitting, onSubmit, updateActivity])

  /**
   * Handle textarea auto-resize
   */
  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget
    target.style.height = 'auto'
    target.style.height = Math.min(target.scrollHeight, CHAT_INPUT.MAX_HEIGHT) + 'px'
  }, [])

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return {
    input,
    setInput,
    isSubmitting,
    handleSubmit,
    textareaRef,
    // Export handlers for component use
    handleInput,
    handleKeyDown,
  } as UseChatInputReturn & {
    handleInput: (e: React.FormEvent<HTMLTextAreaElement>) => void
    handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  }
}
