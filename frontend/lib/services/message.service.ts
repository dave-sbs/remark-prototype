import { createClient } from '@supabase/supabase-js'
import { UIMessage } from 'ai'
import { extractMessageContent, extractToolCalls, extractToolResults } from '@/lib/message-utils'

/**
 * Service for managing chat message operations
 */
export class MessageService {
    private supabase

    constructor() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    }

    /**
     * Get the next sequence number for a thread
     */
    async getNextSequenceNumber(threadId: string): Promise<number> {
        try {
            const { data: lastMessage } = await this.supabase
                .from('chat_messages')
                .select('sequence_number')
                .eq('thread_id', threadId)
                .order('sequence_number', { ascending: false })
                .limit(1)
                .single()

            return lastMessage?.sequence_number ? lastMessage.sequence_number + 1 : 0
        } catch (error) {
            console.error('[MessageService] ❌ Error getting next sequence number:', error)
            return 0
        }
    }

    /**
     * Get already-logged message IDs to avoid duplicates
     */
    async getExistingMessageIds(threadId: string): Promise<Set<string>> {
        try {
            const { data: existingMessages } = await this.supabase
                .from('chat_messages')
                .select('message_id')
                .eq('thread_id', threadId)

            return new Set(existingMessages?.map(m => m.message_id) || [])
        } catch (error) {
            console.error('[MessageService] ❌ Error getting existing messages:', error)
            return new Set()
        }
    }

    /**
     * Log new user/assistant messages to database
     */
    async logMessages(
        threadId: string,
        messages: UIMessage[],
        state: any,
        baseSequenceNum?: number
    ): Promise<void> {
        try {
            const existingMessageIds = await this.getExistingMessageIds(threadId)
            const newMessages = messages.filter(msg => !existingMessageIds.has(msg.id))

            const startSequence = baseSequenceNum ?? await this.getNextSequenceNumber(threadId)

            for (let i = 0; i < newMessages.length; i++) {
                const msg = newMessages[i]
                const content = extractMessageContent(msg)
                const toolCalls = extractToolCalls(msg)
                const toolResults = extractToolResults(msg)

                console.log('[MessageService] 📝 Inserting message:', {
                    message_id: msg.id,
                    role: msg.role,
                    content: content.substring(0, 50) + '...',
                    has_tool_calls: !!toolCalls,
                    has_tool_results: !!toolResults,
                    sequence: startSequence + i
                })

                await this.supabase.from('chat_messages').insert({
                    thread_id: threadId,
                    message_id: msg.id,
                    role: msg.role,
                    content: content,
                    tool_calls: toolCalls,
                    tool_results: toolResults,
                    sequence_number: startSequence + i,
                    agent_state: state,
                    model_used: 'gpt-4.1-mini'
                })
            }

            console.log('[MessageService] ✅ Logged', newMessages.length, 'new messages')
        } catch (error) {
            console.error('[MessageService] ❌ Error logging messages:', error)
            throw error
        }
    }

    /**
     * Log assistant response after streaming completes
     */
    async logAssistantResponse(
        threadId: string,
        content: string,
        toolCalls: any[] | null,
        toolResults: any[] | null,
        state: any,
        tokensUsed?: number
    ): Promise<void> {
        try {
            const nextSequenceNum = await this.getNextSequenceNumber(threadId)
            const assistantMessageId = crypto.randomUUID()

            await this.supabase.from('chat_messages').insert({
                thread_id: threadId,
                message_id: assistantMessageId,
                role: 'assistant',
                content: content,
                tool_calls: toolCalls,
                tool_results: toolResults,
                sequence_number: nextSequenceNum,
                agent_state: state,
                model_used: 'gpt-4.1-mini',
                tokens_used: tokensUsed || null
            })

            console.log('[MessageService] ✅ Assistant response logged')
        } catch (error) {
            console.error('[MessageService] ❌ Error logging assistant response:', error)
            throw error
        }
    }
}
