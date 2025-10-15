'use client'

import { extractMessageContent } from '@/lib/message-utils'
import ProductCard from './ProductCard'
import { useRouter } from 'next/navigation'
import { UIMessage } from 'ai'
import { saveProductRecommendation } from '@/lib/conversation-context'

export default function ChatMessage({ message, threadId }: { message: UIMessage; threadId: string }) {
    const router = useRouter()
    const isUser = message.role === 'user'

    // Check if this message contains a display_product tool call (by toolName, not type)
    const productToolPart = message.parts?.find(
        part => (part as any).toolName === 'display_product'
    )

    // If assistant message with display_product tool, show product card
    if (!isUser && productToolPart) {
        // Find the tool result for display_product
        const productToolResult = message.parts?.find(
            part => part.type === 'tool-result' && (part as any).toolName === 'display_product'
        )

        const hasResult = !!productToolResult

        return (
            <div className="flex flex-col gap-3 max-w-[85%]">
                {hasResult ? (
                    <ProductCard
                        productName={((productToolResult as any).result as { product_name: string; reason: string }).product_name}
                        onNavigate={() => {
                            // Navigate to product page with chat context
                            const result = (productToolResult as any).result as { product_name: string; reason: string }
                            const productName = result.product_name
                            const productId = getProductId(productName)
                            const reason = result.reason

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
                <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere">
                    {content}
                </div>
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

