import { extractMessageContent } from '@/lib/message-utils'

type MessagePart = {
    type: string
    text?: string
}

type Message = {
    id: string
    role: 'user' | 'assistant' | 'system' | 'data'
    parts?: MessagePart[]
}

export default function ChatMessage({ message }: { message: Message }) {
    const isUser = message.role === 'user'

    // Extract text content from parts
    const content = extractMessageContent(message)

    return (
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-2 items-end`}>
            <div className={`
        max-w-[80%] px-4 py-3 text-sm
        ${isUser
                    ? 'bg-blue-600 text-white rounded-3xl rounded-br-sm'
                    : 'bg-gray-200 text-black rounded-3xl rounded-bl-sm'
                }
      `}>
                <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere">
                    {content}
                </div>
            </div>
        </div>
    )
}

