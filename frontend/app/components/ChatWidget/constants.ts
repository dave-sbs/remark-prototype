/**
 * Chat Widget Configuration Constants
 *
 * Centralized configuration for the chat widget to avoid magic numbers
 * and provide a single source of truth for timing, storage, and UI values.
 */

// Thread Management
export const THREAD_TIMEOUT_MS = 20 * 60 * 1000 // 20 minutes
export const TIMEOUT_CHECK_INTERVAL_MS = 60 * 1000 // 1 minute

// Storage Keys
export const STORAGE_KEYS = {
  THREAD: 'remark_chat_thread',
  ACTIVITY: 'remark_last_activity',
} as const

// UI Timing
export const UI_TIMING = {
  EXPERT_POPOVER_DELAY: 2000, // ms
  ONBOARDING_TRANSITION_DELAY: 100, // ms
} as const

// Chat Input
export const CHAT_INPUT = {
  MIN_HEIGHT: 48, // px
  MAX_HEIGHT: 120, // px
  MAX_LINES_BEFORE_SCROLL: 3,
} as const

// Onboarding Validation
export const VALIDATION = {
  MIN_QUERY_LENGTH: 2,
  MIN_NAME_LENGTH: 2,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const
