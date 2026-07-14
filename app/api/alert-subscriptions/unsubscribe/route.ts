import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/alert-subscriptions/unsubscribe?token=<uuid>
// Deletes the subscription matching the token — linked from every alert email.
// Contract: docs/api-contracts/f3-lost-found.md
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')

  if (!token || !UUID_PATTERN.test(token)) {
    return NextResponse.json({ error: 'a valid token is required' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('alert_subscriptions')
    .delete()
    .eq('unsubscribe_token', token)
    .select('id')

  if (error) {
    return NextResponse.json({ error: 'Could not unsubscribe' }, { status: 500 })
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Unknown token' }, { status: 404 })
  }

  return NextResponse.json({ message: 'You will no longer receive alerts.' }, { status: 200 })
}
