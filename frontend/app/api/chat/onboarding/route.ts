import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { threadId, name, email, query } = body

        if (!threadId) {
            return NextResponse.json({ error: 'threadId is required' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Save onboarding data to database
        // This assumes a chat_onboarding table exists with columns: thread_id, name, email, query, created_at
        const { data, error } = await supabase
            .from('chat_onboarding')
            .upsert({
                thread_id: threadId,
                name: name || null,
                email: email || null,
                query: query || null,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'thread_id'
            })

        if (error) {
            console.error('[API /chat/onboarding] Error saving onboarding data:', error)
            throw error
        }

        console.log(`[API /chat/onboarding] Saved onboarding data for thread ${threadId}`)

        return NextResponse.json({ success: true, data })
    } catch (error) {
        console.error('[API /chat/onboarding] Error:', error)
        return NextResponse.json({ error: 'Failed to save onboarding data' }, { status: 500 })
    }
}
