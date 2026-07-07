import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/adoption-requests
// Returns adoption requests for the authenticated shelter
// Contract: docs/api-contracts/f1-shelter-hub.md
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shelter_id = searchParams.get('shelter_id')
  const status = searchParams.get('status')

  if (!shelter_id) {
    return NextResponse.json({ error: 'shelter_id is required' }, { status: 400 })
  }

  const supabase = createServerClient()

  let query = supabase
    .from('adoption_requests')
    .select(`
      id, status, compatibility_score, compatibility_reasons, notes, created_at,
      animals ( id, name, photo_urls ),
      family_profiles ( full_name, email, living_space, has_children, has_other_pets )
    `)
    .eq('shelter_id', shelter_id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const requests = data.map((r: any) => ({
    id: r.id,
    status: r.status,
    compatibility_score: r.compatibility_score,
    compatibility_reasons: r.compatibility_reasons ? JSON.parse(r.compatibility_reasons) : [],
    notes: r.notes,
    animal: r.animals,
    family: r.family_profiles,
    created_at: r.created_at,
  }))

  return NextResponse.json({ requests }, { status: 200 })
}

// POST /api/adoption-requests
// Submits an adoption request from a family to a shelter.
// Note: originally N8N was supposed to notify the shelter by email on new requests.
// That workflow was never implemented — the shelter sees new requests in their dashboard (F1).
// Contract: docs/api-contracts/f2-smart-adoption.md
export async function POST(request: Request) {
  const body = await request.json()
  const { animal_id, shelter_id, family_id, compatibility_score, compatibility_reasons } = body
  // Contract sends the questionnaire nested under family_profile; flat fields kept for compatibility
  const profile = body.family_profile ?? body
  const { living_space, lifestyle, experience, has_other_pets, has_children } = profile

  if (!animal_id || !shelter_id || !family_id) {
    return NextResponse.json({ error: 'animal_id, shelter_id and family_id are required' }, { status: 400 })
  }

  const hasInvalidScore =
    compatibility_score !== undefined &&
    (typeof compatibility_score !== 'number' || compatibility_score < 0 || compatibility_score > 100)
  if (hasInvalidScore) {
    return NextResponse.json({ error: 'compatibility_score must be a number between 0 and 100' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('adoption_requests')
    .insert({
      animal_id, shelter_id, family_id, living_space, lifestyle, experience, has_other_pets, has_children,
      ...(compatibility_score !== undefined && { compatibility_score }),
      // Stored as JSON string (schema: compatibility_reasons text) — GET parses it back
      ...(Array.isArray(compatibility_reasons) && { compatibility_reasons: JSON.stringify(compatibility_reasons) }),
    })
    .select('id, status, animal_id, shelter_id, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { request: data, message: 'Request submitted. The shelter will contact you soon.' },
    { status: 201 }
  )
}
