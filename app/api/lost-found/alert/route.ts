import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// POST /api/lost-found/alert
// Internal endpoint — queries PostGIS for users near a report
// Calls get_users_near_report() and returns the list (used for testing; geo-alert Edge Function handles this automatically)
// Contract: docs/api-contracts/f3-lost-found.md
export async function POST(request: Request) {
  const body = await request.json()
  const { report_id, radius_m = 2000 } = body

  if (!report_id) {
    return NextResponse.json({ error: 'report_id is required' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase.rpc('get_users_near_report', {
    report_id,
    radius_m,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { alerted_users: data ?? [], total: data?.length ?? 0 },
    { status: 200 }
  )
}
