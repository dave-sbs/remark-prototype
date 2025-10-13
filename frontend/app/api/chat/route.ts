import { openai } from '@ai-sdk/openai'
import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import {
    getProductCatalog,
    getProductDetails,
    getAllBasePrices,
    getProductUniqueFeatures,
    getSizeRecommendationForUser,
    getChairConfigurationPrice,
    displayProduct
} from '@/lib/agent-tools'
import { getThreadState, updateThreadState } from '@/lib/agent-state'
import { SALES_AGENT_PROMPT } from '@/lib/prompts'
import { createClient } from '@supabase/supabase-js'
import { extractMessageContent, extractToolCalls, extractToolResults } from '@/lib/message-utils'
import { UIMessage } from 'ai';

export const maxDuration = 30

export async function POST(req: Request) {
    const { messages, threadId }: { messages: UIMessage[], threadId: string } = await req.json();

    // Initialize Supabase client for logging
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate messages array
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        console.error('[API /chat] ❌ Invalid messages array:', messages)
        return new Response(JSON.stringify({ error: 'Invalid messages array' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    // Use threadId or create temporary one
    const activeThreadId = threadId || crypto.randomUUID()
    const state = getThreadState(activeThreadId)

    // Log thread activity
    const clientIP = req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    await supabase.from('chat_threads').upsert({
        thread_id: activeThreadId,
        ip_address: clientIP,
        user_agent: userAgent,
        last_activity_at: new Date().toISOString(),
        status: 'active'
    }, { onConflict: 'thread_id' })

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
            display_product: displayProduct,
        },
        temperature: 0.7,
        onFinish: async (event) => {
            console.log('[API /chat] 🤖 onFinish: Streaming complete, logging assistant response')
            console.log('[API /chat] Response text length:', event.text?.length || 0)
            console.log('[API /chat] Steps:', event.steps?.length || 0)

            // Extract tool calls and results from steps (AI SDK 5.0 multi-step pattern)
            let allToolCalls: any[] = []
            let allToolResults: any[] = []

            if (event.steps) {
                event.steps.forEach((step: any) => {
                    step.content?.forEach((item: any) => {
                        if (item.type === 'tool-call') {
                            allToolCalls.push({
                                toolCallId: item.toolCallId,
                                toolName: item.toolName,
                                input: item.input
                            })
                        } else if (item.type === 'tool-result') {
                            allToolResults.push({
                                toolCallId: item.toolCallId,
                                toolName: item.toolName,
                                input: item.input,
                                output: item.output
                            })
                        }
                    })
                })
            }

            console.log('[API /chat] Tool calls detected:', allToolCalls.length)
            console.log('[API /chat] Tool results detected:', allToolResults.length)
            if (allToolCalls.length > 0) {
                console.log('[API /chat] Tool calls:', allToolCalls.map(tc => tc.toolName).join(', '))
            }

            // Log the assistant's response after streaming completes
            const { data: lastMessage } = await supabase
                .from('chat_messages')
                .select('sequence_number')
                .eq('thread_id', activeThreadId)
                .order('sequence_number', { ascending: false })
                .limit(1)
                .single()

            const nextSequenceNum = lastMessage?.sequence_number ? lastMessage.sequence_number + 1 : 0

            // Extract content from response
            const content = event.text || ''
            const toolCalls = allToolCalls.length > 0 ? allToolCalls : null
            const toolResults = allToolResults.length > 0 ? allToolResults : null

            const assistantMessageId = crypto.randomUUID()

            await supabase.from('chat_messages').insert({
                thread_id: activeThreadId,
                message_id: assistantMessageId,
                role: 'assistant',
                content: content,
                tool_calls: toolCalls,
                tool_results: toolResults,
                sequence_number: nextSequenceNum,
                agent_state: state,
                model_used: 'gpt-4.1-mini',
                tokens_used: event.usage?.totalTokens || null
            })

        }
    })

    // Get the last sequence number for this thread
    const { data: lastMessage } = await supabase
        .from('chat_messages')
        .select('sequence_number')
        .eq('thread_id', activeThreadId)
        .order('sequence_number', { ascending: false })
        .limit(1)
        .single()

    const baseSequenceNum = lastMessage?.sequence_number ? lastMessage.sequence_number + 1 : 0

    // Get already-logged message IDs to avoid duplicates
    const { data: existingMessages } = await supabase
        .from('chat_messages')
        .select('message_id')
        .eq('thread_id', activeThreadId)

    const existingMessageIds = new Set(existingMessages?.map(m => m.message_id) || [])

    // Only log NEW messages
    const newMessages = messages.filter((msg: any) => !existingMessageIds.has(msg.id))

    // Log new messages with proper content extraction
    for (let i = 0; i < newMessages.length; i++) {
        const msg = newMessages[i]
        const content = extractMessageContent(msg)
        const toolCalls = extractToolCalls(msg)
        const toolResults = extractToolResults(msg)

        console.log('[API /chat] 📝 Inserting message:', {
            message_id: msg.id,
            role: msg.role,
            content: content.substring(0, 50) + '...',
            has_tool_calls: !!toolCalls,
            has_tool_results: !!toolResults,
            sequence: baseSequenceNum + i
        })

        await supabase.from('chat_messages').insert({
            thread_id: activeThreadId,
            message_id: msg.id,
            role: msg.role,
            content: content,
            tool_calls: toolCalls,
            tool_results: toolResults,
            sequence_number: baseSequenceNum + i,
            agent_state: state,
            model_used: 'gpt-4.1-mini'
        })
    }

    console.log('[API /chat] ✅ Database logging complete')

    // Return UIMessage stream response (AI SDK 5)
    return result.toUIMessageStreamResponse({
        originalMessages: messages,
    })
}

