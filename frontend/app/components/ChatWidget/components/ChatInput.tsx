'use client'

import { ArrowUp, Loader2 } from 'lucide-react'
import { CHAT_INPUT } from '../constants'

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  isSubmitting: boolean
  onSubmit: () => void
  textareaRef: React.RefObject<HTMLTextAreaElement>
  onInput: (e: React.FormEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

/**
 * Chat Input Component
 *
 * Renders the chat input textarea and submit button.
 * Handles auto-resize and keyboard shortcuts.
 */
export function ChatInput({
  input,
  setInput,
  isSubmitting,
  onSubmit,
  textareaRef,
  onInput,
  onKeyDown,
}: ChatInputProps) {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    onSubmit()
  }

  return (
    <form onSubmit={handleFormSubmit} className="p-4 bg-white rounded-b-xl">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onInput={onInput}
          placeholder="Ask about our chairs..."
          rows={1}
          className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-2xl focus:shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-transparent transition-all resize-none overflow-hidden overflow-y-auto min-h-[48px] max-h-[120px]"
          style={{
            height: 'auto',
            overflowY:
              input.split('\n').length > CHAT_INPUT.MAX_LINES_BEFORE_SCROLL
                ? 'auto'
                : 'hidden',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isSubmitting}
          className="absolute right-2 bottom-2 mb-2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
          aria-label="Send message"
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <ArrowUp />
          )}
        </button>
      </div>
    </form>
  )
}
