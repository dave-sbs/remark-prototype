import { openai } from '@ai-sdk/openai'
import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import {
    getProductCatalog,
    getProductDetails,
    getAllBasePrices,
    getProductUniqueFeatures,
    getSizeRecommendationForUser,
    getChairConfigurationPrice
} from '@/lib/agent-tools'
import { getThreadState, updateThreadState } from '@/lib/agent-state'
import { SALES_AGENT_PROMPT } from '@/lib/prompts'

export const maxDuration = 30

export async function POST(req: Request) {
    const { messages, threadId } = await req.json()

    // Use threadId or create temporary one
    const activeThreadId = threadId || crypto.randomUUID()
    const state = getThreadState(activeThreadId)

    // Pre-load product catalog on first message 
    if (!state.productCatalogContext) {
        try {
            // Manually fetch and format catalog since we can't directly call tool execute
            const supabaseImport = await import('@supabase/supabase-js')
            const supabase = supabaseImport.createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            )

            const { data: products } = await supabase.from('products').select('*').order('name')
            const { data: variants } = await supabase.from('product_variants').select('*').eq('is_default', true)

            const priceMap: Record<string, number> = {}
            variants?.forEach((v: any) => {
                priceMap[v.product_id] = v.base_price
            })

            let catalog = "# Product Catalog\n\n"
            products?.forEach((product: any) => {
                const basePrice = priceMap[product.id] || 'N/A'
                catalog += `**${product.name}**\n`
                catalog += `  - Price Tier: ${product.price_tier}\n`
                catalog += `  - Design Style: ${product.design_style}\n`
                catalog += `  - Base Price: $${basePrice}\n`
                catalog += `  - Product ID: ${product.id}\n\n`
            })

            state.productCatalogContext = `\n\n# PRODUCT CATALOG (Your Context)\n\n${catalog}\n\n---\n\n`
            updateThreadState(activeThreadId, { productCatalogContext: state.productCatalogContext })
        } catch (error) {
            console.error('Failed to load catalog:', error)
            state.productCatalogContext = '\n\n# PRODUCT CATALOG\n\nError loading catalog\n\n---\n\n'
        }
    }

    // Build system prompt with catalog context (replicating Python)
    const systemPrompt = state.productCatalogContext + SALES_AGENT_PROMPT

    // Convert UIMessages to ModelMessages (AI SDK 5)
    const modelMessages = convertToModelMessages(messages)

    // Stream with tools (replicates Python's model_with_tools)
    const result = streamText({
        // CRITICAL: Don't change this model!
        model: openai('gpt-4.1-mini'),
        messages: modelMessages,
        system: systemPrompt,
        stopWhen: stepCountIs(5), // Multi-step tool calling like Python (Vercel AI SDK v5 syntax)
        tools: {
            get_product_catalog: getProductCatalog,
            get_product_details: getProductDetails,
            get_all_base_prices: getAllBasePrices,
            get_product_unique_features: getProductUniqueFeatures,
            get_size_recommendation_for_user: getSizeRecommendationForUser,
            get_chair_configuration_price: getChairConfigurationPrice,
        },
        temperature: 0.7,
    })

    // Return UIMessage stream response (AI SDK 5)
    return result.toUIMessageStreamResponse({
        originalMessages: messages,
    })
}

