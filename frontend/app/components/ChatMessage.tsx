'use client'

import { extractMessageContent } from '@/lib/message-utils'
import ProductCard from './ProductCard'
import { useRouter } from 'next/navigation'
import { UIMessage } from 'ai'

export default function ChatMessage({ message }: { message: UIMessage }) {
    const router = useRouter()
    const isUser = message.role === 'user'

    // Check if this message contains a display_product tool call
    const productToolPart = message.parts?.find(
        part => part.type === 'tool-display_product'
    )

    // If assistant message with display_product tool, show product card
    if (!isUser && productToolPart && productToolPart.type === 'tool-display_product') {
        // Type narrowing - now TypeScript knows this is a tool part
        return (
            <div className="flex flex-col gap-3 max-w-[85%]">
                {/* Render based on tool state */}
                {productToolPart.state === 'input-streaming' && (
                    <div className="bg-gray-200 text-black rounded-3xl rounded-bl-sm px-4 py-3 text-sm">
                        <div className="whitespace-pre-wrap break-words">
                            Loading product card...
                        </div>
                    </div>
                )}

                {productToolPart.state === 'input-available' && (
                    <div className="bg-gray-200 text-black rounded-3xl rounded-bl-sm px-4 py-3 text-sm">
                        <div className="whitespace-pre-wrap break-words">
                            Preparing product card...
                        </div>
                    </div>
                )}

                {productToolPart.state === 'output-available' && (
                    <>
                        {/* Product Card */}
                        <ProductCard
                            productName={(productToolPart.output as any).product_name}
                            onNavigate={() => {
                                // Navigate to product page with chat context
                                const productId = getProductId((productToolPart.output as any).product_name)
                                router.push(`/product/${productId}?from=chat`)
                            }}
                        />

                        {/* Optional text message
                        {(productToolPart.output as any).message && (
                            <div className="bg-gray-200 text-black rounded-3xl rounded-bl-sm px-4 py-3 text-sm">
                                <div className="whitespace-pre-wrap break-words">
                                    {(productToolPart.output as any).message}
                                </div>
                            </div>
                        )} */}
                    </>
                )}

                {productToolPart.state === 'output-error' && (
                    <div className="bg-red-100 text-red-800 rounded-3xl rounded-bl-sm px-4 py-3 text-sm">
                        <div className="whitespace-pre-wrap break-words">
                            Error: {productToolPart.errorText || 'Failed to load product card'}
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

