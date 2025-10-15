import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const threadId = searchParams.get('threadId')

    if (!threadId) {
        return NextResponse.json({ error: 'threadId is required' }, { status: 400 })
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        // Fetch messages for this thread, ordered by sequence
        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('thread_id', threadId)
            .order('sequence_number', { ascending: true })

        if (error) throw error

        console.log(`[API /chat/messages] Fetched ${messages?.length || 0} messages for thread ${threadId}`)

        // Debug: Log a sample message to see structure
        if (messages && messages.length > 0) {
            const sampleWithTools = messages.find(m => m.tool_calls || m.tool_results)
            if (sampleWithTools) {
                console.log('[API /chat/messages] Sample message with tools:', JSON.stringify({
                    role: sampleWithTools.role,
                    tool_calls: sampleWithTools.tool_calls,
                    tool_results: sampleWithTools.tool_results
                }, null, 2))
            }
        }

        // Transform to UIMessage format
        const uiMessages = messages?.map(msg => {
            const parts = []

            // Add text content
            if (msg.content) {
                parts.push({
                    type: 'text',
                    text: msg.content
                })
            }

            // Add tool calls if present - use standard format for ALL tools
            if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
                msg.tool_calls.forEach((toolCall: { toolCallId: string; toolName: string; input: unknown }) => {
                    parts.push({
                        type: 'tool-call',
                        toolCallId: toolCall.toolCallId,
                        toolName: toolCall.toolName,
                        args: toolCall.input
                    })
                })
            }

            // Add tool results if present
            if (msg.tool_results && Array.isArray(msg.tool_results)) {
                msg.tool_results.forEach((toolResult: { toolCallId: string; toolName: string; output: unknown }) => {
                    parts.push({
                        type: 'tool-result',
                        toolCallId: toolResult.toolCallId,
                        toolName: toolResult.toolName,
                        result: toolResult.output
                    })
                })
            }

            return {
                id: msg.message_id,
                role: msg.role,
                parts: parts.length > 0 ? parts : undefined
            }
        }) || []

        // Debug: Log reconstructed message with tools
        const reconstructedWithTools = uiMessages.find(m => m.parts?.some(p => p.type === 'tool-call' || p.type?.startsWith('tool-')))
        if (reconstructedWithTools) {
            console.log('[API /chat/messages] Reconstructed message sample:', JSON.stringify(reconstructedWithTools, null, 2))
        }

        return NextResponse.json({ messages: uiMessages })
    } catch (error) {
        console.error('[API /chat/messages] Error fetching messages:', error)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
}
