'use client'

import { X } from 'lucide-react'

interface ChatHeaderProps {
  onClose: () => void
}

/**
 * Chat Header Component
 *
 * Displays the chat widget header with branding and close button.
 */
export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="p-4 flex justify-between items-center bg-black rounded-t-xl border-b border-gray-200">
      <div>
        <h3 className="font-medium text-lg tracking-tight text-white">
          Herm & Mills
        </h3>
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors text-white hover:text-black cursor-pointer"
        aria-label="Close chat"
      >
        <X />
      </button>
    </div>
  )
}
