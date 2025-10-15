'use client'

import { UIMessage } from 'ai'
import { Loader2 } from 'lucide-react'
import ChatMessage from '../../ChatMessage'
import ExpertMatchingCard from '../../onboarding/ExpertMatchingCard'

interface ChatMessagesProps {
  messages: UIMessage[]
  threadId: string
  isLoading: boolean
  error: Error | null
  userName?: string
  userQuery?: string
  onRetry?: () => void
}

/**
 * Chat Messages Component
 *
 * Renders the chat messages list with loading and error states.
 * Shows the expert matching card after the first user message if applicable.
 */
export function ChatMessages({
  messages,
  threadId,
  isLoading,
  error,
  userName,
  userQuery,
  onRetry,
}: ChatMessagesProps) {
  // Show loading state while fetching messages
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-xs">Loading conversation...</p>
        </div>
      </div>
    )
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-sm mb-2">Failed to load messages</p>
          <p className="text-xs text-gray-400 mb-4">{error.message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  // Show empty state when no messages
  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-white">
        <div className="text-center text-gray-500 text-sm mt-8 tracking-tight">
          <p className="mb-2">Hi! Welcome to Herm & Mills!</p>
          <p className="text-xs">
            Ask me about our chairs, pricing, or anything else.
          </p>
        </div>
      </div>
    )
  }

  // Render messages
  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-white">
      {messages.map((msg, index) => (
        <div key={msg.id}>
          <ChatMessage message={msg} threadId={threadId} />
          {/* Show expert matching card after the first user message */}
          {index === 0 && msg.role === 'user' && (
            <div className="mt-4">
              <ExpertMatchingCard userName={userName} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
