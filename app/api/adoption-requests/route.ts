import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface AdoptionRequestBody {
  animal_id: string
  shelter_id: string
  full_name: string
  email: string
  phone?: string
  family_profile?: {
    living_space?: string
    lifestyle?: string
    experience?: string
    has_other_pets?: boolean
    has_children?: boolean
  }
  compatibility_score?: number
  compatibility_reasons?: string[]
}

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
      full_name, email, phone, living_space, has_children, has_other_pets,
      animals ( id, name, photo_urls )
    `)
    .eq('shelter_id', shelter_id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requests: data.map(toRequestResponse) }, { status: 200 })
}

// Keeps the contract's response shape: contact + questionnaire under `family`
function toRequestResponse(r: any) {
  return {
    id: r.id,
    status: r.status,
    compatibility_score: r.compatibility_score,
    compatibility_reasons: r.compatibility_reasons ? JSON.parse(r.compatibility_reasons) : [],
    notes: r.notes,
    animal: r.animals,
    family: {
      full_name: r.full_name,
      email: r.email,
      phone: r.phone,
      living_space: r.living_space,
      has_children: r.has_children,
      has_other_pets: r.has_other_pets,
    },
    created_at: r.created_at,
  }
}

// POST /api/adoption-requests
// Submits an adoption request — no account needed, contact info travels inline.
// Contract: docs/api-contracts/f2-smart-adoption.md
export async function POST(request: Request) {
  const body: Partial<AdoptionRequestBody> = await request.json()
  const validationError = validateAdoptionRequest(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const { animal_id, shelter_id, full_name, email, phone, compatibility_score, compatibility_reasons } =
    body as AdoptionRequestBody
  const { living_space, lifestyle, experience, has_other_pets, has_children } = body.family_profile ?? {}

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('adoption_requests')
    .insert({
      animal_id, shelter_id, phone,
      full_name, email: email.toLowerCase(),
      living_space, lifestyle, experience, has_other_pets, has_children,
      ...(compatibility_score !== undefined && { compatibility_score }),
      // Stored as JSON string (schema: compatibility_reasons text) — GET parses it back
      ...(Array.isArray(compatibility_reasons) && { compatibility_reasons: JSON.stringify(compatibility_reasons) }),
    })
    .select('id, status, animal_id, shelter_id, created_at')
    .single()

  // 23505 = unique violation on adoption_requests_pending_dedupe
  if (error?.code === '23505') {
    return NextResponse.json({ error: 'You already have a pending request for this animal.' }, { status: 409 })
  }
  if (error) {
    return NextResponse.json({ error: 'Could not submit request' }, { status: 500 })
  }

  return NextResponse.json(
    { request: data, message: 'Request submitted. The shelter will contact you soon.' },
    { status: 201 }
  )
}

function validateAdoptionRequest(body: Partial<AdoptionRequestBody>): string | null {
  if (!body?.animal_id || !body?.shelter_id) return 'animal_id and shelter_id are required'
  if (typeof body.full_name !== 'string' || body.full_name.trim().length === 0 || body.full_name.length > 120) {
    return 'full_name is required (max 120 chars)'
  }
  if (typeof body.email !== 'string' || body.email.length > 255 || !EMAIL_PATTERN.test(body.email)) {
    return 'a valid email is required'
  }
  if (body.phone != null && (typeof body.phone !== 'string' || body.phone.length > 20)) {
    return 'phone must be a string of up to 20 chars'
  }
  return validateScore(body.compatibility_score)
}

function validateScore(score: number | undefined): string | null {
  if (score === undefined) return null
  if (typeof score !== 'number' || score < 0 || score > 100) {
    return 'compatibility_score must be a number between 0 and 100'
  }
  return null
}
