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
import { MessageService } from './message.service'

interface StreamOptions {
    messages: any[]
    systemPrompt: string
    threadId: string
    state: any
}

interface ToolCallData {
    toolCallId: string
    toolName: string
    input: any
}

interface ToolResultData extends ToolCallData {
    output: any
}

/**
 * Service for managing AI model streaming and tool interactions
 * 
 * This service is responsible for:
 * - Streaming the AI model's response
 * - Extracting tool calls and results from the streaming steps
 * - Logging the messages to the database
 * - Handling the stream completion
 * - Handling the stream errors
 * - Handling the stream timeout
 * - Handling the stream cancellation
 * - Handling the stream interruption
 */
export class AIStreamingService {
    private messageService: MessageService

    constructor() {
        this.messageService = new MessageService()
    }

    /**
     * Extract tool calls and results from streaming steps
     */
    private extractToolData(steps: any[]): {
        toolCalls: ToolCallData[]
        toolResults: ToolResultData[]
    } {
        const toolCalls: ToolCallData[] = []
        const toolResults: ToolResultData[] = []

        steps?.forEach((step: any) => {
            step.content?.forEach((item: any) => {
                if (item.type === 'tool-call') {
                    toolCalls.push({
                        toolCallId: item.toolCallId,
                        toolName: item.toolName,
                        input: item.input
                    })
                } else if (item.type === 'tool-result') {
                    toolResults.push({
                        toolCallId: item.toolCallId,
                        toolName: item.toolName,
                        input: item.input,
                        output: item.output
                    })
                }
            })
        })

        return { toolCalls, toolResults }
    }

    /**
     * Log debug information about messages with tools
     */
    private logToolMessages(messages: any[]): void {
        const toolMessages = messages.filter(m =>
            m.parts?.some((p: any) => p.type === 'tool-call' || p.type?.startsWith('tool-'))
        )

        if (toolMessages.length > 0) {
            console.log('[AIStreamingService] 🔧 Messages with tools:', toolMessages.length)
            toolMessages.forEach((msg, idx) => {
                console.log(`  Message ${idx}:`, JSON.stringify({
                    id: msg.id,
                    role: msg.role,
                    parts: msg.parts?.map((p: any) => ({
                        type: p.type,
                        toolName: (p as any).toolName,
                        hasArgs: !!(p as any).args
                    }))
                }, null, 2))
            })
        }
    }

    /**
     * Create streaming response with AI model
     */
    async createStream(options: StreamOptions) {
        const { messages, systemPrompt, threadId, state } = options

        // Log debug info
        console.log('[AIStreamingService] 🚀 Starting stream with', messages.length, 'messages')

        // Filter out tool messages with empty content before conversion
        // In AI SDK 5.0, tool results are embedded in assistant messages, not separate tool messages
        const cleanedMessages = messages.filter(msg => {
            // Remove tool role messages entirely (they should be in assistant messages)
            if (msg.role === 'tool') {
                console.log('[AIStreamingService] 🧹 Filtering out tool message:', msg.id)
                return false
            }
            return true
        })

        console.log('[AIStreamingService] 📊 Message count: original =', messages.length, ', cleaned =', cleanedMessages.length)

        // Convert to model messages
        const modelMessages = convertToModelMessages(cleanedMessages)

        // Debug: Log model messages to fix open ai api issue
        // console.log('[AIStreamingService] 🔧 model messages:')
        // modelMessages.forEach((msg, idx) => {
        //     console.log(`  Message ${idx}:`, JSON.stringify(msg, null, 2))
        // })

        // Create stream with tools
        const result = streamText({
            model: openai('gpt-4.1-mini'),
            messages: modelMessages,
            system: systemPrompt,
            stopWhen: stepCountIs(5),
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
                await this.handleStreamFinish(event, threadId, state)
            }
        })

        return result
    }

    /**
     * Handle stream completion and log assistant response
     */
    private async handleStreamFinish(event: any, threadId: string, state: any): Promise<void> {
        try {
            console.log('[AIStreamingService] 🤖 Stream complete')
            console.log('[AIStreamingService] Response text length:', event.text?.length || 0)
            console.log('[AIStreamingService] Steps:', event.steps?.length || 0)

            // Extract tool data from steps
            const { toolCalls, toolResults } = this.extractToolData(event.steps || [])

            console.log('[AIStreamingService] Tool calls detected:', toolCalls.length)
            console.log('[AIStreamingService] Tool results detected:', toolResults.length)

            if (toolCalls.length > 0) {
                console.log('[AIStreamingService] Tool calls:', toolCalls.map(tc => tc.toolName).join(', '))
            }

            // Log assistant response
            await this.messageService.logAssistantResponse(
                threadId,
                event.text || '',
                toolCalls.length > 0 ? toolCalls : null,
                toolResults.length > 0 ? toolResults : null,
                state,
                event.usage?.totalTokens
            )

        } catch (error) {
            console.error('[AIStreamingService] ❌ Error in onFinish handler:', error)
            throw error
        }
    }
}
