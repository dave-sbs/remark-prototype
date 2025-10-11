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
    const content = message.parts
        ?.map(part => part.type === 'text' ? part.text : '')
        .join('') || ''

    return (
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-2 items-end`}>
            <div className={`
        max-w-[80%] px-4 py-3 text-sm
        ${isUser
                    ? 'bg-[#2b2b2b] text-white rounded-2xl rounded-br-md'
                    : 'bg-[#f5f1eb] text-gray-900 rounded-2xl rounded-bl-md'
                }
      `}>
                <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere">
                    {content}
                </div>
            </div>
        </div>
    )
}

