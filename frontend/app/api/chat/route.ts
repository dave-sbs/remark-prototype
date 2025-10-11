import { openai } from '@ai-sdk/openai'
import { streamText, convertToModelMessages } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
    const { messages } = await req.json()

    // Convert UIMessages to ModelMessages (AI SDK 5)
    const modelMessages = convertToModelMessages(messages)

    const result = streamText({
        model: openai('gpt-4.1-nano'),
        messages: modelMessages,
        system: 'You are a helpful Herman Miller furniture sales assistant. Be friendly and concise.',
    })

    // Return UIMessage stream response (AI SDK 5)
    return result.toUIMessageStreamResponse({
        originalMessages: messages,
    })
}

