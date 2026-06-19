import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// PATCH /api/adoption-requests/:id
// Updates status of an adoption request
// Side effect (approved): N8N sends confirmation email to family
// Contract: docs/api-contracts/f1-shelter-hub.md
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const { status, notes } = body

  const VALID_STATUSES = ['pending', 'seen', 'approved', 'rejected']
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('adoption_requests')
    .update({ ...(status && { status }), ...(notes !== undefined && { notes }) })
    .eq('id', params.id)
    .select('id, status, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ request: data }, { status: 200 })
}
