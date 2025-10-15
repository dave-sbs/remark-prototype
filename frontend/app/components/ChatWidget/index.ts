/**
 * ChatWidget Module Exports
 *
 * Central export file for the refactored ChatWidget module.
 */

// Hooks
export { useThreadPersistence } from './hooks/useThreadPersistence'
export { useThreadMessages } from './hooks/useThreadMessages'
export { useOnboardingFlow } from './hooks/useOnboardingFlow'
export { useChatInput } from './hooks/useChatInput'

// Components
export { ChatHeader } from './components/ChatHeader'
export { ChatInput } from './components/ChatInput'
export { ChatMessages } from './components/ChatMessages'
export { OnboardingFlow } from './components/OnboardingFlow'

// Services
export * from './services/chatApi'

// Constants
export * from './constants'

// Types
export type * from './types'
