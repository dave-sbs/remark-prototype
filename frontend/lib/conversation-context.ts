// Client-side storage for conversation-to-product context
type ProductRecommendation = {
    threadId: string
    productId: string
    productName: string
    recommendedVariant?: string
    recommendedAddons?: string[]
    customDescription?: string
    conversationSummary?: string
    timestamp: number
}

const STORAGE_KEY = 'remark_product_recommendations'
const EXPIRY_MS = 30 * 60 * 1000 // 30 minutes

export function saveProductRecommendation(rec: ProductRecommendation) {
    try {
        if (typeof window === 'undefined') return

        const existing = getProductRecommendations()
        existing.push(rec)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))

    } catch (error) {
        console.error('[ConversationContext] Failed to save recommendation:', error)
    }
}

export function getProductRecommendation(productId: string): ProductRecommendation | null {
    const recs = getProductRecommendations()

    // Get most recent non-expired recommendation for this product
    const rec = recs
        .filter(r => r.productId === productId && Date.now() - r.timestamp < EXPIRY_MS)
        .sort((a, b) => b.timestamp - a.timestamp)[0]

    return rec || null
}

function getProductRecommendations(): ProductRecommendation[] {
    try {
        if (typeof window === 'undefined') return []

        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}