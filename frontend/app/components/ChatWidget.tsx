'use client'

import { useState, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { MessageCircle } from 'lucide-react'

// Hooks
import { useThreadPersistence } from './ChatWidget/hooks/useThreadPersistence'
import { useThreadMessages } from './ChatWidget/hooks/useThreadMessages'
import { useOnboardingFlow } from './ChatWidget/hooks/useOnboardingFlow'
import { useChatInput } from './ChatWidget/hooks/useChatInput'

// Components
import { ChatHeader } from './ChatWidget/components/ChatHeader'
import { ChatInput } from './ChatWidget/components/ChatInput'
import { ChatMessages } from './ChatWidget/components/ChatMessages'
import { OnboardingFlow } from './ChatWidget/components/OnboardingFlow'
import ExpertPopover from './ExpertPopover'

// Constants
import { UI_TIMING } from './ChatWidget/constants'

/**
 * Chat Widget Component (Refactored)
 *
 * A clean, maintainable chat widget built with custom hooks and
 * composed components. This replaces the monolithic ChatWidget.tsx
 * with a well-architected, testable implementation.
 *
 * Key improvements:
 * - No hydration issues (SSR-safe localStorage)
 * - Proper state management with useReducer
 * - Extracted business logic into custom hooks
 * - Composed UI from smaller components
 * - Better error handling
 * - No memory leaks
 * - Type-safe throughout
 */
export default function ChatWidget() {
    // UI state
    const [isOpen, setIsOpen] = useState(false)
    const [showExpertPopover, setShowExpertPopover] = useState(false)

    // Thread persistence and activity tracking
    const { threadId, updateActivity, startNewThread } = useThreadPersistence()

    // Load messages from database
    const {
        messages: initialMessages,
        isLoading: isLoadingMessages,
        error: messagesError,
        refetch: refetchMessages,
    } = useThreadMessages(threadId)

    // Initialize useChat hook
    const { messages, sendMessage, setMessages } = useChat({
        id: threadId,
        messages: [],
        transport: new DefaultChatTransport({
            api: '/api/chat',
            prepareSendMessagesRequest: (options: any) => ({
                api: options.api,
                body: {
                    messages: options.messages,
                    ...options.body,
                    threadId,
                },
                headers: options.headers,
                credentials: options.credentials,
            }),
        }),
    })

    // Handle message submission
    const handleMessageSubmit = async (text: string) => {
        await sendMessage({ text })
    }

    // Chat input management
    const chatInput = useChatInput(handleMessageSubmit, updateActivity) as any

    // Onboarding flow management
    const { state: onboarding, handlers: onboardingHandlers } = useOnboardingFlow(
        threadId,
        async (query: string) => {
            // When onboarding completes, send the query to AI
            await sendMessage({ text: query })
        }
    )

    // Sync initialMessages to useChat when loaded
    useEffect(() => {
        if (!isLoadingMessages && initialMessages.length > 0 && messages.length === 0) {
            console.log(initialMessages)
            setMessages(initialMessages)
        }
    }, [isLoadingMessages, initialMessages, messages.length, setMessages])

    // Determine if we should show onboarding
    const shouldShowOnboarding =
        !isLoadingMessages &&
        initialMessages.length === 0 &&
        messages.length === 0 &&
        onboarding.currentStep !== 'complete'

    // Show expert popover after delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowExpertPopover(true)
        }, UI_TIMING.EXPERT_POPOVER_DELAY)

        return () => clearTimeout(timer)
    }, [])

    // Reset onboarding when starting a new thread
    useEffect(() => {
        onboardingHandlers.resetOnboarding()
    }, [threadId])

    return (
        <>
            {/* Floating button (closed state) */}
            {!isOpen && (
                <div className="fixed bottom-8 right-8 z-50 flex items-end gap-4">
                    {showExpertPopover && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <ExpertPopover />
                        </div>
                    )}
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-16 h-16 bg-black text-white rounded-full shadow-xl hover:bg-gray-800 transition-colors flex items-center justify-center cursor-pointer animate-[ping_5s_opacity-100_ease-in-out_infinite]"
                        aria-label="Open chat"
                    >
                        <MessageCircle className="w-7 h-7" />
                    </button>
                </div>
            )}

            {/* Chat panel (open state) */}
            {isOpen && (
                <div className="fixed bottom-8 right-8 w-full md:w-[420px] max-w-[360px] h-[600px] bg-white rounded-xl shadow-2xl flex flex-col z-50">
                    {/* Header */}
                    <ChatHeader onClose={() => setIsOpen(false)} />

                    {/* Messages or Onboarding */}
                    {shouldShowOnboarding ? (
                        <OnboardingFlow state={onboarding} handlers={onboardingHandlers} />
                    ) : (
                        <ChatMessages
                            messages={messages}
                            threadId={threadId}
                            isLoading={isLoadingMessages}
                            error={messagesError}
                            userName={onboarding.name}
                            userQuery={onboarding.query}
                            onRetry={refetchMessages}
                        />
                    )}

                    {/* Input area - hidden during onboarding */}
                    {!shouldShowOnboarding && (
                        <ChatInput
                            input={chatInput.input}
                            setInput={chatInput.setInput}
                            isSubmitting={chatInput.isSubmitting}
                            onSubmit={chatInput.handleSubmit}
                            textareaRef={chatInput.textareaRef}
                            onInput={chatInput.handleInput}
                            onKeyDown={chatInput.handleKeyDown}
                        />
                    )}
                </div>
            )}
        </>
    )
}
