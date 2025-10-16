import { UIMessage } from 'ai'

/**
 * Validation result type
 */
export interface ValidationResult {
    valid: boolean
    error?: string
}

/**
 * Validate messages array from request
 */
export function validateMessages(messages: any): ValidationResult {
    if (!messages) {
        return {
            valid: false,
            error: 'Messages array is required'
        }
    }

    if (!Array.isArray(messages)) {
        return {
            valid: false,
            error: 'Messages must be an array'
        }
    }

    if (messages.length === 0) {
        return {
            valid: false,
            error: 'Messages array cannot be empty'
        }
    }

    return { valid: true }
}

/**
 * Validate and parse request body
 */
export async function parseRequestBody(req: Request): Promise<{
    messages: UIMessage[]
    threadId: string
} | null> {
    try {
        const body = await req.json()
        const { messages, threadId } = body

        const validation = validateMessages(messages)
        if (!validation.valid) {
            throw new Error(validation.error)
        }

        return {
            messages,
            threadId: threadId || crypto.randomUUID()
        }
    } catch (error) {
        console.error('[Validation] ❌ Error parsing request body:', error)
        return null
    }
}

/**
 * Create error response
 */
export function createErrorResponse(message: string, status: number = 400): Response {
    return new Response(
        JSON.stringify({ error: message }),
        {
            status,
            headers: { 'Content-Type': 'application/json' }
        }
    )
}
