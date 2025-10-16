import { createClient } from '@supabase/supabase-js'

/**
 * Service for managing chat thread metadata to track user activity on database
 */
export class ThreadService {
    private supabase

    constructor() {
        this.supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!
        )
    }

    /**
     * Upsert thread activity with client metadata
     */
    async upsertThreadActivity(
        threadId: string,
        clientIP: string,
        userAgent: string
    ): Promise<void> {
        try {
            const { error } = await this.supabase.from('chat_threads').upsert({
                thread_id: threadId,
                ip_address: clientIP,
                user_agent: userAgent,
                last_activity_at: new Date().toISOString(),
                status: 'active'
            }, { onConflict: 'thread_id' })

            if (error) {
                throw new Error(`Failed to upsert thread activity: ${error.message}`)
            }

            console.log('[ThreadService] ✅ Thread activity logged:', threadId)
        } catch (error) {
            console.error('[ThreadService] ❌ Error upserting thread activity:', error)
            throw error
        }
    }

    /**
     * Extract client metadata from request
     */
    extractClientMetadata(req: Request): { ip: string; userAgent: string } {
        const ip = req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown'
        const userAgent = req.headers.get('user-agent') || 'unknown'

        return { ip, userAgent }
    }
}
