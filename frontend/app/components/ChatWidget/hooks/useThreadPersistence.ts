'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  THREAD_TIMEOUT_MS,
  TIMEOUT_CHECK_INTERVAL_MS,
  STORAGE_KEYS,
} from '../constants'
import type { UseThreadPersistenceReturn } from '../types'

/**
 * Thread Persistence Hook
 *
 * Manages thread ID persistence with localStorage, activity tracking,
 * and automatic timeout detection. Fixes hydration issues by deferring
 * localStorage access to useEffect.
 *
 * Features:
 * - SSR-safe localStorage access
 * - Automatic thread timeout detection
 * - Activity tracking
 * - Proper cleanup on unmount
 */
export function useThreadPersistence(): UseThreadPersistenceReturn {
  // Initialize with a new UUID to avoid hydration mismatch
  const [threadId, setThreadId] = useState<string>(() => crypto.randomUUID())
  const [lastActivity, setLastActivity] = useState<number>(Date.now())
  const [isInitialized, setIsInitialized] = useState(false)

  // Use ref to track if we should create a new thread on next effect run
  const shouldResetRef = useRef(false)

  /**
   * Start a new thread and clear localStorage
   */
  const startNewThread = useCallback(() => {
    const newThreadId = crypto.randomUUID()
    const now = Date.now()

    setThreadId(newThreadId)
    setLastActivity(now)

    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.THREAD, newThreadId)
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, now.toString())
    }
  }, [])

  /**
   * Update the last activity timestamp
   */
  const updateActivity = useCallback(() => {
    const now = Date.now()
    setLastActivity(now)

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, now.toString())
    }
  }, [])

  /**
   * Initialize thread from localStorage on mount (client-side only)
   * This prevents hydration mismatches by running after initial render
   */
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized) return

    const storedThreadId = localStorage.getItem(STORAGE_KEYS.THREAD)
    const storedActivity = localStorage.getItem(STORAGE_KEYS.ACTIVITY)

    if (storedThreadId && storedActivity) {
      const timeSinceActivity = Date.now() - parseInt(storedActivity, 10)

      if (timeSinceActivity < THREAD_TIMEOUT_MS) {
        // Resume existing thread
        setThreadId(storedThreadId)
        setLastActivity(parseInt(storedActivity, 10))
      } else {
        // Thread expired, start fresh but keep the generated ID
        localStorage.setItem(STORAGE_KEYS.THREAD, threadId)
        localStorage.setItem(STORAGE_KEYS.ACTIVITY, Date.now().toString())
      }
    } else {
      // No stored thread, save the generated one
      localStorage.setItem(STORAGE_KEYS.THREAD, threadId)
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, Date.now().toString())
    }

    setIsInitialized(true)
  }, [isInitialized, threadId])

  /**
   * Set up automatic timeout checker
   * Checks every minute if the thread has exceeded the timeout
   */
  useEffect(() => {
    if (!isInitialized) return

    const checkTimeout = () => {
      if (typeof window === 'undefined') return

      const storedActivity = localStorage.getItem(STORAGE_KEYS.ACTIVITY)
      if (!storedActivity) return

      const timeSinceActivity = Date.now() - parseInt(storedActivity, 10)

      if (timeSinceActivity >= THREAD_TIMEOUT_MS) {
        startNewThread()
      }
    }

    const intervalId = setInterval(checkTimeout, TIMEOUT_CHECK_INTERVAL_MS)

    return () => {
      clearInterval(intervalId)
    }
  }, [isInitialized, startNewThread])

  return {
    threadId,
    lastActivity,
    startNewThread,
    updateActivity,
  }
}
