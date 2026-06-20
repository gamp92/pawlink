import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// POST /api/lost-found/alert
// Debug endpoint — originally built for N8N (which needed an HTTP endpoint to query PostGIS).
// N8N was replaced by the geo-alert Edge Function, which calls get_users_near_report() directly.
// This endpoint is now only useful for manually verifying that PostGIS returns the correct
// nearby users for a given report (e.g. testing seed users test+near vs test+far from Postman).
// It does NOT send emails — that is handled entirely by the geo-alert Edge Function.
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
