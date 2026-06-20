import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// PATCH /api/lost-found/:id
// Updates a report — typically to mark as resolved
// Only the original reporter can update (enforced by RLS)
// Contract: docs/api-contracts/f3-lost-found.md
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const { status } = body

  if (status && !['open', 'resolved'].includes(status)) {
    return NextResponse.json({ error: "status must be 'open' or 'resolved'" }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('lost_found_reports')
    .update({ ...(status && { status }) })
    .eq('id', params.id)
    .select('id, status, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ report: data }, { status: 200 })
}
