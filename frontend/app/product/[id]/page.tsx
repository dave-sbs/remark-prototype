'use client'

import { use } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ProductDetail from '@/app/components/ProductDetail'
import ChatWidget from '@/app/components/ChatWidget'
import { productDetailsData } from '@/app/data/productDetails'
import { getProductRecommendation } from '@/lib/conversation-context'
import { useEffect, useState } from 'react'

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const searchParams = useSearchParams()
    const router = useRouter()
    const fromChat = searchParams.get('from') === 'chat'

    const [conversationContext, setConversationContext] = useState<{
        customDescription?: string
        conversationSummary?: string
    } | null>(null)

    const product = productDetailsData[id]

    useEffect(() => {
        // If navigated from chat, retrieve conversation context
        if (fromChat) {
            const recommendation = getProductRecommendation(id)
            if (recommendation) {
                setConversationContext({
                    customDescription: recommendation.customDescription,
                    conversationSummary: recommendation.conversationSummary
                })
            }
        }
    }, [fromChat, id])

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Product not found</h1>
                    <button
                        onClick={() => router.push('/')}
                        className="text-blue-600 hover:underline"
                    >
                        Return to home
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <ProductDetail
                product={product}
                onClose={() => router.back()}
                conversationContext={conversationContext}
            />
            <ChatWidget />
        </>
    )
}
