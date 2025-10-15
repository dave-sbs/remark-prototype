```
'use client'

import { useState, useEffect, useRef } from 'react'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai';

import ChatMessage from './ChatMessage'
import ExpertPopover from './ExpertPopover'
import ConnectExpertCard from './onboarding/ConnectExpertCard'
import QueryInputCard from './onboarding/QueryInputCard'
import NameInputCard from './onboarding/NameInputCard'
import EmailInputCard from './onboarding/EmailInputCard'
import ExpertMatchingCard from './onboarding/ExpertMatchingCard'

import { ArrowUp, Loader2, MessageCircle, X } from 'lucide-react'

type OnboardingStep = 'connect_prompt' | 'query_input' | 'name_input' | 'email_input' | 'expert_matching' | 'complete'

export default function ChatWidget() {
    // Thread management constants
    const THREAD_TIMEOUT_MS = 20 * 60 * 1000 // 20 minutes
    const STORAGE_THREAD_KEY = 'remark_chat_thread'
    const STORAGE_ACTIVITY_KEY = 'remark_last_activity'

    // Activity state
    const [lastActivity, setLastActivity] = useState(Date.now())
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMessages, setIsLoadingMessages] = useState(true)

    // Chat state
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const [fallbackInput, setFallbackInput] = useState('')
    const [initialMessages, setInitialMessages] = useState<any[]>([])
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Expert popover state
    const [showExpertPopover, setShowExpertPopover] = useState(false)

    // Onboarding state
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('connect_prompt')
    const [userQuery, setUserQuery] = useState('')
    const [userName, setUserName] = useState('')
    const [userEmail, setUserEmail] = useState('')
    const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]) // Track completed steps for progressive rendering

    // Initialize threadId immediately
    const [threadId, setThreadId] = useState<string>(() => {
        console.log('[ChatWidget] Initializing threadId...')
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_THREAD_KEY)
            const storedActivity = localStorage.getItem(STORAGE_ACTIVITY_KEY)

            console.log('[ChatWidget] localStorage check:', {
                stored,
                storedActivity,
                timeSinceActivity: storedActivity ? Date.now() - parseInt(storedActivity) : null,
                timeoutThreshold: THREAD_TIMEOUT_MS
            })

            if (stored && storedActivity) {
                const timeSince = Date.now() - parseInt(storedActivity)
                if (timeSince < THREAD_TIMEOUT_MS) {
                    console.log('[ChatWidget] ✅ RESUMING existing thread:', stored)
                    return stored // Resume existing thread
                } else {
                    console.log('[ChatWidget] ⚠️ Thread expired (inactive for', timeSince, 'ms). Creating new thread.')
                }
            } else {
                console.log('[ChatWidget] ⚠️ No existing thread found in localStorage')
            }
        }
        // Create new thread
        const newId = crypto.randomUUID()
        console.log('[ChatWidget] 🆕 CREATING NEW THREAD:', newId)
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_THREAD_KEY, newId)
            localStorage.setItem(STORAGE_ACTIVITY_KEY, Date.now().toString())
            console.log('[ChatWidget] Saved new thread to localStorage')
        }
        return newId
    })

    // Load messages from database on mount if resuming thread
    useEffect(() => {
        async function loadMessages() {
            console.log('[ChatWidget] Loading messages for threadId:', threadId)
            setIsLoadingMessages(true)
            try {
                const response = await fetch(`/api/chat/messages?threadId=${threadId}`)
                if (response.ok) {
                    const data = await response.json()
                    console.log('[ChatWidget] ✅ Loaded', data.messages?.length || 0, 'messages from database')
                    setInitialMessages(data.messages || [])
                } else {
                    console.log('[ChatWidget] No messages found, starting fresh')
                    setInitialMessages([])
                }
            } catch (error) {
                console.error('[ChatWidget] Error loading messages:', error)
                setInitialMessages([])
            } finally {
                setIsLoadingMessages(false)
                console.log('[ChatWidget] 🎯 isLoadingMessages set to false')
            }
        }

        loadMessages()
    }, [threadId])

    // Check for timeout every minute
    useEffect(() => {
        console.log('[ChatWidget] Setting up timeout checker (checks every 60s)')
        const interval = setInterval(() => {
            const storedActivity = localStorage.getItem(STORAGE_ACTIVITY_KEY)
            if (storedActivity) {
                const timeSince = Date.now() - parseInt(storedActivity)
                console.log('[ChatWidget] Timeout check - time since last activity:', timeSince, 'ms')
                if (timeSince >= THREAD_TIMEOUT_MS) {
                    console.log('[ChatWidget] ⏰ TIMEOUT DETECTED - calling startNewThread()')
                    startNewThread()
                }
            }
        }, 60000) // Check every minute

        return () => {
            console.log('[ChatWidget] Cleaning up timeout checker')
            clearInterval(interval)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Show expert popover after 2 second delay
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowExpertPopover(true)
        }, 100) // 100ms

        return () => clearTimeout(timer)
    }, [])

    // Reset textarea height when input is empty
    useEffect(() => {
        if (input === '' && textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }, [input])

    // Initialize useChat - MUST be called on every render (Rules of Hooks)
    const { messages, sendMessage, setMessages } = useChat({
        id: threadId,
        messages: [], // Start with empty array
        transport: new DefaultChatTransport({
            api: '/api/chat',
            prepareSendMessagesRequest: (options: any) => {
                return {
                    api: options.api,
                    body: {
                        messages: options.messages,
                        ...options.body,
                        threadId: threadId
                    },
                    headers: options.headers,
                    credentials: options.credentials
                }
            }
        })
    });

    // Update messages when initialMessages are loaded from database
    useEffect(() => {
        if (!isLoadingMessages && initialMessages.length > 0) {
            console.log('[ChatWidget] Syncing', initialMessages.length, 'messages to useChat')
            setMessages(initialMessages)
        }
    }, [isLoadingMessages, initialMessages, setMessages])

    // Detect when to show onboarding
    useEffect(() => {
        if (!isLoadingMessages) {
            if (initialMessages.length === 0 && messages.length === 0) {
                console.log('[ChatWidget] No messages found - starting onboarding')
                setShowOnboarding(true)
                setOnboardingStep('connect_prompt')
            } else {
                console.log('[ChatWidget] Messages exist - skipping onboarding')
                setShowOnboarding(false)
                setOnboardingStep('complete')
            }
        }
    }, [isLoadingMessages, initialMessages, messages])

    const startNewThread = () => {
        console.log('[ChatWidget] 🔄 startNewThread() called!')
        console.log('[ChatWidget] Previous threadId:', threadId)
        const newThreadId = crypto.randomUUID()
        console.log('[ChatWidget] New threadId:', newThreadId)
        setThreadId(newThreadId)
        setInitialMessages([])  // Clear messages for new thread
        setMessages([])  // Clear useChat messages immediately

        // Reset onboarding state
        setShowOnboarding(false)
        setOnboardingStep('connect_prompt')
        setUserQuery('')
        setUserName('')
        setUserEmail('')
        setCompletedSteps([])

        const now = Date.now()
        setLastActivity(now)
        localStorage.setItem(STORAGE_THREAD_KEY, newThreadId)
        localStorage.setItem(STORAGE_ACTIVITY_KEY, now.toString())
        console.log('[ChatWidget] Thread reset complete. localStorage updated.')
    }

    // Onboarding handlers
    const handleConnectExpert = () => {
        console.log('[ChatWidget] User clicked Connect with Expert')
        setCompletedSteps(prev => [...prev, 'connect_prompt'])
        setOnboardingStep('query_input')
    }

    const handleQuerySubmit = (query: string) => {
        console.log('[ChatWidget] User submitted query:', query)
        setUserQuery(query)
        setCompletedSteps(prev => [...prev, 'query_input'])
        setOnboardingStep('name_input')
    }

    const handleNameSubmit = (name: string) => {
        console.log('[ChatWidget] User submitted name:', name)
        setUserName(name)
        setCompletedSteps(prev => [...prev, 'name_input'])
        setOnboardingStep('email_input')
    }

    const handleNameSkip = () => {
        console.log('[ChatWidget] User skipped name')
        setUserName('')
        setCompletedSteps(prev => [...prev, 'name_input'])
        setOnboardingStep('email_input')
    }

    const handleEmailSubmit = async (email: string) => {
        console.log('[ChatWidget] User submitted email:', email)
        setUserEmail(email)
        setCompletedSteps(prev => [...prev, 'email_input'])
        await finalizeOnboarding(email)
    }

    const handleEmailSkip = async () => {
        console.log('[ChatWidget] User skipped email')
        setUserEmail('')
        setCompletedSteps(prev => [...prev, 'email_input'])
        await finalizeOnboarding('')
    }

    const finalizeOnboarding = async (email: string) => {
        // Save onboarding data to database
        try {
            await fetch('/api/chat/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId,
                    name: userName,
                    email: email,
                    query: userQuery
                })
            })
        } catch (error) {
            console.error('[ChatWidget] Failed to save onboarding data:', error)
        }

        // Show expert matching step
        setOnboardingStep('expert_matching')

        // After 100ms, complete onboarding and trigger AI response
        setTimeout(async () => {
            // Complete onboarding
            setOnboardingStep('complete')
            setShowOnboarding(false)

            // Send the query to the AI
            await sendMessage({ text: userQuery })
        }, 100)
    }

    return (
        <>
            {/* Floating button (closed state) */}
            {!isOpen && (
                <div className="fixed bottom-8 right-8 z-50 flex items-end gap-4">
                    {showExpertPopover &&
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <ExpertPopover />
                        </div>
                    }
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-16 h-16 bg-black text-white rounded-full shadow-xl hover:bg-gray-800 transition-colors flex items-center justify-center cursor-pointer animate-[ping_5s_opacity-100_ease-in-out_infinite]"
                    >
                        <MessageCircle className="w-7 h-7" />
                    </button>
                </div>
            )}

            {/* Chat panel (open state) */}
            {isOpen && (
                <div className="fixed bottom-8 right-8 w-full md:w-[420px] max-w-[360px] h-[600px] bg-white rounded-xl shadow-2xl flex flex-col z-50">
                    {/* Header */}
                    <div className="p-4 flex justify-between items-center bg-black rounded-t-xl border-b border-gray-200">
                        <div>
                            <h3 className="font-medium text-lg tracking-tight text-white">Herm & Mills</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-white hover:text-black cursor-pointer"
                        >
                            <X />
                        </button>
                    </div>

                    {/* Messages container */}
                    {isLoadingMessages ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                <p className="text-xs">Loading conversation...</p>
                            </div>
                        </div>
                    ) : showOnboarding ? (
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-white">
                            {/* Progressive onboarding - show all completed steps + current step */}

                            {/* Step 1: Connect Expert Card - only show when it's the current step */}
                            {onboardingStep === 'connect_prompt' && (
                                <ConnectExpertCard onConnect={handleConnectExpert} />
                            )}

                            {/* Step 2: Query Input */}
                            {onboardingStep === 'query_input' && (
                                <QueryInputCard onSubmit={handleQuerySubmit} />
                            )}
                            {/* Show query as a user message after submission */}
                            {completedSteps.includes('query_input') && userQuery && (
                                <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-900 ml-auto max-w-[80%]">
                                    {userQuery}
                                </div>
                            )}

                            {/* Step 3: Name Input */}
                            {onboardingStep === 'name_input' && (
                                <NameInputCard onSubmit={handleNameSubmit} onSkip={handleNameSkip} />
                            )}

                            {/* Step 4: Email Input */}
                            {onboardingStep === 'email_input' && (
                                <EmailInputCard userName={userName} onSubmit={handleEmailSubmit} onSkip={handleEmailSkip} />
                            )}

                            {/* Step 5: Expert Matching */}
                            {onboardingStep === 'expert_matching' && (
                                <>
                                    <div className="bg-gray-50 rounded-lg p-3 text-center text-sm text-gray-700">
                                        Hold on tight {userName || 'there'}, connecting you with an expert...
                                    </div>
                                    <ExpertMatchingCard userName={userName} />
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-white">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 text-sm mt-8 tracking-tight">
                                    <p className="mb-2">👋 Hi! Welcome to Herm & Mills!</p>
                                    <p className="text-xs">Ask me about our chairs, pricing, or anything else.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Render messages with expert card after first user message */}
                                    {messages.map((msg, index) => (
                                        <div key={msg.id}>
                                            <ChatMessage message={msg} threadId={threadId} />
                                            {/* Show expert matching card after the first user message */}
                                            {index === 0 && msg.role === 'user' && userQuery && (
                                                <div className="mt-4">
                                                    <ExpertMatchingCard userName={userName} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    {/* Input area - hidden during onboarding */}
                    {!showOnboarding && (
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault()
                                if (!input.trim()) return

                                try {
                                    setIsLoading(true)
                                    setFallbackInput(input)
                                    setInput('')

                                    // Send message (threadId is included in useChat body config)
                                    await sendMessage({ text: input })

                                    // Update activity timestamp
                                    const now = Date.now()
                                    setLastActivity(now)
                                    localStorage.setItem(STORAGE_ACTIVITY_KEY, now.toString())
                                } catch (error) {
                                    setInput(fallbackInput)
                                    console.error('[ChatWidget] ❌ Failed to send message:', error)
                                } finally {
                                    setIsLoading(false)
                                }
                            }}
                            className="p-4 bg-white rounded-b-xl"
                        >
                            <div className="relative">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            e.currentTarget.form?.requestSubmit()
                                        }
                                    }}
                                    placeholder="Ask about our chairs..."
                                    rows={1}
                                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-2xl focus:shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-transparent transition-all resize-none overflow-hidden overflow-y-auto min-h-[48px] max-h-[120px]"
                                    style={{
                                        height: 'auto',
                                        overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden'
                                    }}
                                    onInput={(e) => {
                                        const target = e.currentTarget
                                        target.style.height = 'auto'
                                        target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="absolute right-2 bottom-2 mb-2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <ArrowUp />}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </>
    )
}
```