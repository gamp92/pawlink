import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// PATCH /api/adoption-requests/:id
// Updates status of an adoption request. Approving also marks the animal
// itself as adopted (done BEFORE flipping the request's own status, so the
// adoption-confirmation email — triggered by that status flip — never fires
// for a request whose animal sync failed).
// Side effects (approved only): animal.status -> 'adopted'; Supabase Database
// Webhook triggers adoption-confirmation Edge Function -> confirmation email.
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

  // Keyed off the resulting status, not the transition — re-approving an
  // already-approved request just re-marks the animal adopted (idempotent,
  // harmless). Reverting to available on reject-after-approve is out of scope.
  if (status === 'approved') {
    const { data: existing, error: fetchError } = await supabase
      .from('adoption_requests')
      .select('animal_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Adoption request not found' }, { status: 404 })
    }

    const { error: animalError } = await supabase
      .from('animals')
      .update({ status: 'adopted' })
      .eq('id', existing.animal_id)

    if (animalError) {
      return NextResponse.json({ error: 'Could not mark the animal as adopted' }, { status: 500 })
    }
  }

  const { data, error } = await supabase
    .from('adoption_requests')
    .update({ ...(status && { status }), ...(notes !== undefined && { notes }) })
    .eq('id', params.id)
    .select('id, status, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { request: { id: data.id, status: data.status, updated_at: data.updated_at } },
    { status: 200 }
  )
}
