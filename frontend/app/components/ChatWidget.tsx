'use client'

import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import ChatMessage from './ChatMessage'
import { ArrowUp, Loader2 } from 'lucide-react'

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [input, setInput] = useState('')
    const [fallbackInput, setFallbackInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { messages, sendMessage } = useChat()

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
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-xl">
                        <div>
                            <h3 className="font-semibold text-lg">Boku Studio</h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="4" x2="4" y2="12" />
                                <line x1="4" y1="4" x2="12" y2="12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages container */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
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
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about our chairs..."
                                className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-transparent transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
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

