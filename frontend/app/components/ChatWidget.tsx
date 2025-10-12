'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat } from '@ai-sdk/react'
import ChatMessage from './ChatMessage'
import { ArrowUp, CrossIcon, Loader2, MessageCircleX, X } from 'lucide-react'

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const [fallbackInput, setFallbackInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [threadId, setThreadId] = useState<string>()
    const [lastActivity, setLastActivity] = useState(Date.now())
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Thread management constants
    const THREAD_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
    const STORAGE_THREAD_KEY = 'remark_chat_thread'
    const STORAGE_ACTIVITY_KEY = 'remark_last_activity'

    // Thread initialization/recovery logic
    useEffect(() => {
        const storedThreadId = localStorage.getItem(STORAGE_THREAD_KEY)
        const storedActivity = localStorage.getItem(STORAGE_ACTIVITY_KEY)

        if (storedThreadId && storedActivity) {
            const timeSinceLastActivity = Date.now() - parseInt(storedActivity)

            if (timeSinceLastActivity < THREAD_TIMEOUT_MS) {
                // Resume existing thread
                setThreadId(storedThreadId)
                setLastActivity(parseInt(storedActivity))
            } else {
                // Thread expired, start new
                startNewThread()
            }
        } else {
            // No existing thread, start new
            startNewThread()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Check for timeout every minute
    useEffect(() => {
        const interval = setInterval(() => {
            const storedActivity = localStorage.getItem(STORAGE_ACTIVITY_KEY)
            if (storedActivity) {
                const timeSince = Date.now() - parseInt(storedActivity)
                if (timeSince >= THREAD_TIMEOUT_MS) {
                    startNewThread()
                }
            }
        }, 60000) // Check every minute

        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Reset textarea height when input is empty
    useEffect(() => {
        if (input === '' && textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }, [input])

    const { messages, sendMessage } = useChat({
        // @ts-expect-error - AI SDK v5 types not fully updated yet, but body parameter works as documented
        body: { threadId },
    })

    const startNewThread = () => {
        const newThreadId = crypto.randomUUID()
        setThreadId(newThreadId)
        const now = Date.now()
        setLastActivity(now)
        localStorage.setItem(STORAGE_THREAD_KEY, newThreadId)
        localStorage.setItem(STORAGE_ACTIVITY_KEY, now.toString())
    }

    return (
        <>
            {/* Floating button (closed state) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 w-16 h-16 bg-black text-white rounded-full shadow-xl hover:bg-gray-800 transition-colors z-50 flex items-center justify-center"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </button>
            )}

            {/* Chat panel (open state) */}
            {isOpen && (
                <div className="fixed bottom-8 right-8 w-full md:w-[420px] max-w-[420px] h-[600px] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col z-50">
                    {/* Header */}
                    <div className="p-4 flex justify-between items-center bg-white rounded-t-xl">
                        <div>
                            <h3 className="font-semibold text-lg">Boku Studio</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X />
                        </button>
                    </div>

                    {/* Messages container */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-white">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-500 text-sm mt-8">
                                <p className="mb-2">👋 Hi! Welcome to Boku Studio!</p>
                                <p className="text-xs">Ask me about our chairs, pricing, or anything else.</p>
                            </div>
                        ) : (
                            messages.map(msg => (
                                <ChatMessage key={msg.id} message={msg} />
                            ))
                        )}
                    </div>

                    {/* Input area */}
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault()
                            if (!input.trim()) return

                            try {
                                setIsLoading(true)
                                setFallbackInput(input)
                                setInput('')
                                await sendMessage({ text: input })

                                // Update activity timestamp
                                const now = Date.now()
                                setLastActivity(now)
                                localStorage.setItem(STORAGE_ACTIVITY_KEY, now.toString())
                            } catch (error) {
                                setInput(fallbackInput)
                                console.error('Failed to send message:', error)
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

