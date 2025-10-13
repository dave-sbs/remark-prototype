# Product Card in Chatbot with Dynamic Product Page

## Overview

Create a seamless purchase flow where the agent can display a rich product card in the chat, and clicking it opens a product details page pre-configured with conversation context (recommended variant, add-ons, descriptions).

## Part 1: Product Card Component in Chat

### 1.1 Create ProductCard Component

**File**: `frontend/app/components/ProductCard.tsx` (new)

```typescript
'use client'

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

type ProductCardProps = {
    productName: string
    onNavigate: () => void
}

export default function ProductCard({ productName, onNavigate }: ProductCardProps) {
    // Map product names to images and IDs
    const productMap: Record<string, { id: string, image: string, number: string }> = {
        'Aeron Chair': { id: '1', image: '/product_images/landing/aeron.jpg', number: 'n°0001' },
        'Cosm Chair': { id: '2', image: '/product_images/landing/cosm.jpg', number: 'n°0002' },
        'Eames Aluminum Group Chair': { id: '3', image: '/product_images/landing/eames.jpg', number: 'n°0003' },
        'Lino Chair': { id: '4', image: '/product_images/landing/lino.jpg', number: 'n°0004' }
    }

    const product = productMap[productName]
    
    if (!product) return null

    return (
        <button
            onClick={onNavigate}
            className="group relative w-full max-w-[280px] bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all hover:border-gray-400"
        >
            {/* Image */}
            <div className="relative w-full h-48 bg-[#c5beb3]">
                <Image
                    src={product.image}
                    alt={productName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="280px"
                />
            </div>
            
            {/* Content */}
            <div className="p-4 text-left">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                    {product.number}
                </p>
                <h3 className="text-sm font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                    {productName}
                </h3>
                <div className="flex items-center text-xs text-gray-600 group-hover:text-blue-600 transition-colors">
                    <span>View details</span>
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
            
            {/* Badge (optional) */}
            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                Recommended
            </div>
        </button>
    )
}
```

### 1.2 Add display_product Tool

**File**: `frontend/lib/agent-tools.ts`

Add new tool at the end:

```typescript
export const displayProduct = tool({
    description: 'Display a product card in the chat when the user is ready to explore or purchase a specific product. Use this when the conversation has narrowed down to a specific product recommendation.',
    inputSchema: z.object({
        product_name: z.string().describe('Exact name of the product (e.g., "Aeron Chair", "Cosm Chair", "Eames Aluminum Group Chair", "Lino Chair")'),
        reason: z.string().describe('Brief reason why this product matches their needs (e.g., "Perfect for long sitting sessions with PostureFit support")')
    }),
    execute: async ({ product_name, reason }) => {
        // This tool doesn't execute anything - it's for UI rendering
        return {
            action: 'display_product',
            product_name,
            reason,
            message: `I've shown you the ${product_name}. Click the card above to view full details and customize your configuration.`
        }
    }
})
```

**File**: `frontend/app/api/chat/route.ts`

Add to tools object (line 94-100):

```typescript
import { displayProduct } from '@/lib/agent-tools'

// In streamText tools:
tools: {
    // ... existing tools
    display_product: displayProduct,
}
```

### 1.3 Update Prompt to Use Tool

**File**: `frontend/lib/prompts.ts`

Update tool list in SALES_AGENT_PROMPT (around line 21-26):

```typescript
**Available Tools:**
- `get_product_catalog()` - All products with prices (AUTO-CALLED on first message)
- `get_product_details(product_name)` - Full features for specific product
- `get_all_base_prices()` - All products sorted by price
- `get_product_unique_features(product_name)` - Key differentiators
- `get_size_recommendation_for_user(...)` - Size recommendations
- `get_chair_configuration_price(...)` - Custom configuration pricing
- `display_product(product_name, reason)` - Show product card when user is ready to explore/purchase
```

Add guidance in Phase 3 (around line 61):

```typescript
## Phase 3: Decision Support (Messages 8+)
**Goals:** Address concerns, reinforce fit, handle objections, move to commitment

**Tactics:**
- Validate choice: "The [product] is perfect for..."
- Summarize fit: "Here's why this works for you..."
- **Call display_product when user shows clear purchase intent**
- Future-pace: "You'll appreciate the [feature] when..."
```

### 1.4 Detect and Render Product Cards

**File**: `frontend/app/components/ChatMessage.tsx`

Update to detect and render product cards:

```typescript
import { extractMessageContent } from '@/lib/message-utils'
import ProductCard from './ProductCard'
import { useRouter } from 'next/navigation'

type MessagePart = {
    type: string
    text?: string
    toolCallId?: string
    toolName?: string
    args?: any
    result?: any
}

type Message = {
    id: string
    role: 'user' | 'assistant' | 'system' | 'data'
    parts?: MessagePart[]
}

export default function ChatMessage({ message }: { message: Message }) {
    const router = useRouter()
    const isUser = message.role === 'user'

    // Check if this message contains a display_product tool call
    const productToolCall = message.parts?.find(
        part => part.type === 'tool-call' && part.toolName === 'display_product'
    )

    // Check if this message contains display_product result
    const productToolResult = message.parts?.find(
        part => part.type === 'tool-result' && part.toolName === 'display_product'
    )

    // Extract text content from parts
    const content = extractMessageContent(message)

    // If assistant message with display_product tool, show product card
    if (!isUser && (productToolCall || productToolResult)) {
        const args = productToolCall?.args || productToolResult?.result
        const productName = args?.product_name

        if (productName) {
            return (
                <div className="flex flex-col gap-3 max-w-[85%]">
                    {/* Product Card */}
                    <ProductCard
                        productName={productName}
                        onNavigate={() => {
                            // Navigate to product page with chat context
                            const productId = getProductId(productName)
                            router.push(`/product/${productId}?from=chat`)
                        }}
                    />
                    
                    {/* Optional text message */}
                    {content && (
                        <div className="bg-gray-200 text-black rounded-3xl rounded-bl-sm px-4 py-3 text-sm">
                            <div className="whitespace-pre-wrap break-words">
                                {content}
                            </div>
                        </div>
                    )}
                </div>
            )
        }
    }

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

// Helper function
function getProductId(productName: string): string {
    const map: Record<string, string> = {
        'Aeron Chair': '1',
        'Cosm Chair': '2',
        'Eames Aluminum Group Chair': '3',
        'Lino Chair': '4'
    }
    return map[productName] || '1'
}
```

## Part 2: Dynamic Product Details Page

### 2.1 Create Product Page Route

**File**: `frontend/app/product/[id]/page.tsx` (new)

```typescript
'use client'

import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import ProductDetail from '@/app/components/ProductDetail'
import { productDetailsData } from '@/app/data/productDetails'

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const searchParams = useSearchParams()
    const fromChat = searchParams.get('from') === 'chat'
    
    const product = productDetailsData[id]
    
    if (!product) {
        return <div>Product not found</div>
    }

    // TODO: If fromChat, fetch conversation context and customize product display
    
    return (
        <ProductDetail
            product={product}
            onClose={() => window.history.back()}
        />
    )
}
```

### 2.2 Store Conversation Context for Product Recommendations

**File**: `frontend/lib/conversation-context.ts` (new)

```typescript
// Client-side storage for conversation-to-product context
type ProductRecommendation = {
    threadId: string
    productId: string
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
        const existing = getProductRecommendations()
        existing.push(rec)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    } catch (error) {
        console.error('Failed to save recommendation:', error)
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
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}
```

### 2.3 Save Context When Product Card is Clicked

Update `ChatMessage.tsx`:

```typescript
import { saveProductRecommendation } from '@/lib/conversation-context'

// In the ProductCard onNavigate:
onNavigate={() => {
    const productId = getProductId(productName)
    
    // Save conversation context
    saveProductRecommendation({
        threadId: 'current-thread-id', // Pass this as prop
        productId,
        recommendedVariant: args?.recommended_variant,
        recommendedAddons: args?.recommended_addons,
        customDescription: args?.reason,
        conversationSummary: content,
        timestamp: Date.now()
    })
    
    router.push(`/product/${productId}?from=chat`)
}}
```

### 2.4 Enhanced ProductDetail with Conversation Context

**File**: `frontend/app/components/ProductDetail.tsx`

Add highlighting for recommended options:

```typescript
// Add optional prop
type ProductDetailProps = {
    product: ProductDetailData
    onClose: () => void
    conversationContext?: {
        customDescription?: string
        recommendedAddons?: string[]
    }
}

// In the component, show conversation context:
{conversationContext?.customDescription && (
    <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
        <p className="text-sm font-semibold text-blue-900 mb-1">
            💬 Based on our conversation
        </p>
        <p className="text-sm text-blue-800">
            {conversationContext.customDescription}
        </p>
    </div>
)}
```

## Testing Flow

1. Start conversation: "I need a chair for back pain and long sitting"
2. Agent recommends Aeron
3. User: "show me the Aeron"
4. Agent calls `display_product("Aeron Chair", "Perfect for long sitting with PostureFit support")`
5. Product card appears in chat
6. Click card → Opens `/product/1?from=chat`
7. Product page shows with custom description highlighting conversation context

## Benefits

✅ Rich visual product display in chat

✅ Seamless transition to product page

✅ Conversation context preserved

✅ Recommended options pre-highlighted

✅ Faster purchase decision flow