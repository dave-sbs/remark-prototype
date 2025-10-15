import { UIMessage } from 'ai'

/**
 * Onboarding step types
 */
export type OnboardingStep =
  | 'connect_prompt'
  | 'query_input'
  | 'name_input'
  | 'email_input'
  | 'expert_matching'
  | 'complete'

/**
 * Onboarding state management
 */
export interface OnboardingState {
  currentStep: OnboardingStep
  query: string
  name: string
  email: string
  completedSteps: OnboardingStep[]
  isActive: boolean
}

export type OnboardingAction =
  | { type: 'CONNECT_EXPERT' }
  | { type: 'SUBMIT_QUERY'; payload: string }
  | { type: 'SUBMIT_NAME'; payload: string }
  | { type: 'SKIP_NAME' }
  | { type: 'SUBMIT_EMAIL'; payload: string }
  | { type: 'SKIP_EMAIL' }
  | { type: 'START_MATCHING' }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_ONBOARDING' }

/**
 * Onboarding data for API
 */
export interface OnboardingData {
  threadId: string
  name: string
  email: string
  query: string
}

/**
 * Thread persistence
 */
export interface ThreadData {
  threadId: string
  lastActivity: number
}

/**
 * API Response types
 */
export interface MessagesResponse {
  messages: UIMessage[]
}

export interface OnboardingResponse {
  success: boolean
  data?: any
}

export interface ApiError {
  error: string
  message?: string
}

/**
 * Chat input state
 */
export interface ChatInputState {
  value: string
  isSubmitting: boolean
  error?: string
}

/**
 * Hook return types
 */
export interface UseThreadPersistenceReturn {
  threadId: string
  lastActivity: number
  startNewThread: () => void
  updateActivity: () => void
}

export interface UseThreadMessagesReturn {
  messages: UIMessage[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export interface UseOnboardingFlowReturn {
  state: OnboardingState
  handlers: {
    handleConnectExpert: () => void
    handleQuerySubmit: (query: string) => void
    handleNameSubmit: (name: string) => void
    handleNameSkip: () => void
    handleEmailSubmit: (email: string) => void
    handleEmailSkip: () => void
    resetOnboarding: () => void
  }
}

export interface UseChatInputReturn {
  input: string
  setInput: (value: string) => void
  isSubmitting: boolean
  handleSubmit: () => Promise<void>
  textareaRef: React.RefObject<HTMLTextAreaElement>
}
