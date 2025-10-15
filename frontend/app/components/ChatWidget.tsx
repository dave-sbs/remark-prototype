'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, PrepareSendMessagesRequest } from 'ai';
import ChatMessage from './ChatMessage'
import { ArrowUp, CrossIcon, Loader2, MessageCircle, MessageCircleX, X } from 'lucide-react'

export default function ChatWidget() {
    // Thread management constants
    const THREAD_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
    const STORAGE_THREAD_KEY = 'remark_chat_thread'
    const STORAGE_ACTIVITY_KEY = 'remark_last_activity'

    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const [fallbackInput, setFallbackInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [initialMessages, setInitialMessages] = useState<any[]>([])
    const [isLoadingMessages, setIsLoadingMessages] = useState(true)

    // Initialize threadId immediately (not in useEffect)
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

    const [lastActivity, setLastActivity] = useState(Date.now())
    const textareaRef = useRef<HTMLTextAreaElement>(null)

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
                    console.log('[ChatWidget] Sample message:', data.messages?.[0])
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

    const startNewThread = () => {
        console.log('[ChatWidget] 🔄 startNewThread() called!')
        console.log('[ChatWidget] Previous threadId:', threadId)
        const newThreadId = crypto.randomUUID()
        console.log('[ChatWidget] New threadId:', newThreadId)
        setThreadId(newThreadId)
        setInitialMessages([])  // Clear messages for new thread
        setMessages([])  // Clear useChat messages immediately
        const now = Date.now()
        setLastActivity(now)
        localStorage.setItem(STORAGE_THREAD_KEY, newThreadId)
        localStorage.setItem(STORAGE_ACTIVITY_KEY, now.toString())
        console.log('[ChatWidget] Thread reset complete. localStorage updated.')
    }

    return (
        <>
            {/* Floating button (closed state) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 w-16 h-16 bg-black/85 text-white rounded-full shadow-xl hover:bg-gray-800 transition-colors z-50 flex items-center justify-center"
                >
                    <MessageCircle className="w-7 h-7" />
                </button>
            )}

            {/* Chat panel (open state) */}
            {isOpen && (
                <div className="fixed bottom-8 right-8 w-full md:w-[420px] max-w-[420px] h-[600px] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col z-50">
                    {/* Header */}
                    <div className="p-4 flex justify-between items-center bg-black rounded-t-xl border-b border-gray-200">
                        <div>
                            <h3 className="font-medium text-lg tracking-tight text-white">Herm & Mills</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-white hover:text-black"
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
                    ) : (
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-white">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 text-sm mt-8 tracking-tight">
                                    <p className="mb-2">👋 Hi! Welcome to Herm & Mills!</p>
                                    <p className="text-xs">Ask me about our chairs, pricing, or anything else.</p>
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <ChatMessage key={msg.id} message={msg} threadId={threadId} />
                                ))
                            )}
                        </div>
                    )}

                    {/* Input area */}
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
                </div>
            )}
        </>
    )
}

