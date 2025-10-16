'use client'

import { extractMessageContent } from '@/lib/message-utils'
import ProductCard from './ProductCard'
import { useRouter } from 'next/navigation'
import { UIMessage } from 'ai'
import { saveProductRecommendation } from '@/lib/conversation-context'

import TypingIndicator from './ChatWidget/components/TypingIndicator'


export default function ChatMessage({ message, threadId }: { message: UIMessage; threadId: string }) {
    const router = useRouter()
    const isUser = message.role === 'user'

    // Check if this message contains a display_product tool (AI SDK 5.0 typed tool parts)
    const productToolPart = message.parts?.find(
        part => part.type === 'tool-display_product'
    )

    // If assistant message with display_product tool, show product card
    if (!isUser && productToolPart) {
        const typedToolPart = productToolPart as any

        // Check if the tool has completed execution (state: 'output-available')
        const hasResult = typedToolPart.state === 'output-available' && typedToolPart.output

        return (
            <div className="flex flex-col gap-3 max-w-[85%]">
                {hasResult ? (
                    <ProductCard
                        productName={(typedToolPart.output as { product_name: string; reason: string }).product_name}
                        onNavigate={() => {
                            // Navigate to product page with chat context
                            const output = typedToolPart.output as { product_name: string; reason: string }
                            const productName = output.product_name
                            const productId = getProductId(productName)
                            const reason = output.reason

                            // Extract text content from the entire message for context
                            const content = extractMessageContent(message)

                            // Save conversation context to localStorage
                            saveProductRecommendation({
                                threadId,
                                productId,
                                productName,
                                customDescription: reason,
                                conversationSummary: content,
                                timestamp: Date.now()
                            })

                            router.push(`/product/${productId}?from=chat`)
                        }}
                    />
                ) : (
                    <div className="bg-gray-200 text-black rounded-3xl rounded-bl-sm px-4 py-3 text-sm">
                        <div className="whitespace-pre-wrap break-words">
                            Loading product card...
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Extract text content from parts
    const content = extractMessageContent(message)

    // Regular text message
    return (
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-2 items-end`}>
            <div className={`
                max-w-[80%] px-4 py-3 text-sm font-normal
                ${isUser
                    ? 'bg-blue-600 text-white rounded-3xl rounded-br-sm'
                    : 'bg-gray-200 text-black rounded-3xl rounded-bl-sm'
                }
            `}>
                {content ? (
                    <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere">
                        {content}
                    </div>
                ) : (
                    <TypingIndicator />
                )}
            </div>
        </div>
    )
}

// Helper function to map product names to IDs
function getProductId(productName: string): string {
    const map: Record<string, string> = {
        'Aeron Chair': '1',
        'Cosm Chair': '2',
        'Eames Aluminum Group Chair': '3',
        'Lino Chair': '4'
    }
    return map[productName] || '1'
}

