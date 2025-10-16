import { getThreadState, updateThreadState } from '@/lib/agent-state'
import { SALES_AGENT_PROMPT } from '@/lib/prompts'
import { ThreadService } from '@/lib/services/thread.service'
import { MessageService } from '@/lib/services/message.service'
import { CatalogService } from '@/lib/services/catalog.service'
import { AIStreamingService } from '@/lib/services/ai-streaming.service'
import { parseRequestBody, createErrorResponse } from '@/lib/utils/validation'

export const maxDuration = 30

export async function POST(req: Request) {
    try {
        // Initialize services
        const threadService = new ThreadService()
        const messageService = new MessageService()
        const catalogService = new CatalogService()
        const aiStreamingService = new AIStreamingService()

        // Parse and validate request
        const body = await parseRequestBody(req)
        if (!body) {
            return createErrorResponse('Invalid request body')
        }

        const { messages, threadId: activeThreadId } = body

        // Get thread state
        const state = getThreadState(activeThreadId)

        // Log thread activity
        const { ip, userAgent } = threadService.extractClientMetadata(req)
        await threadService.upsertThreadActivity(activeThreadId, ip, userAgent)

        // Load product catalog on first message
        if (!state.productCatalogContext) {
            state.productCatalogContext = await catalogService.loadProductCatalog()
            updateThreadState(activeThreadId, { productCatalogContext: state.productCatalogContext })
        }

        // Build system prompt with catalog context
        const systemPrompt = state.productCatalogContext + SALES_AGENT_PROMPT

        // Get next sequence number before streaming
        const baseSequenceNum = await messageService.getNextSequenceNumber(activeThreadId)

        // Log new user messages
        await messageService.logMessages(activeThreadId, messages, state, baseSequenceNum)

        // Create AI streaming response
        const result = await aiStreamingService.createStream({
            messages,
            systemPrompt,
            threadId: activeThreadId,
            state
        })

        console.log('[API /chat] ✅ Request processing complete')

        // Return streaming response
        return result.toUIMessageStreamResponse({
            originalMessages: messages,
        })

    } catch (error) {
        console.error('[API /chat] ❌ Error processing request:', error)
        return createErrorResponse(
            error instanceof Error ? error.message : 'Internal server error',
            500
        )
    }
}

