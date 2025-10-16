import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { threadId, name, email, query } = body

        if (!threadId) {
            return NextResponse.json({ error: 'threadId is required' }, { status: 400 })
        }

        console.log('SECRERET KEY', process.env.SUPABASE_SECRET_KEY)

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SECRET_KEY!
        )

        // Save onboarding data to database
        const { data, error } = await supabase
            .from('chat_onboarding')
            .upsert({
                thread_id: threadId,
                user_name: name || null,
                user_email: email || null,
                user_query: query || null,
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
