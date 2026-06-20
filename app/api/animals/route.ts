import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/animals
// Returns all animals for the authenticated shelter
// Contract: docs/api-contracts/f1-shelter-hub.md
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shelter_id = searchParams.get('shelter_id')
  const status = searchParams.get('status')
  const species = searchParams.get('species')

  if (!shelter_id) {
    return NextResponse.json({ error: 'shelter_id is required' }, { status: 400 })
  }

  const supabase = createServerClient()

  let query = supabase
    .from('animals')
    .select('id, name, species, breed, age_years, size, gender, color, description, energy_level, good_with_kids, good_with_pets, vaccinated, sterilized, medical_notes, status, photo_urls, social_post, created_at')
    .eq('shelter_id', shelter_id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (species) query = query.eq('species', species)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ animals: data }, { status: 200 })
}

// POST /api/animals
// Creates a new animal — Supabase Database Webhook triggers social-post Edge Function
// Contract: docs/api-contracts/f1-shelter-hub.md
export async function POST(request: Request) {
  const body = await request.json()
  const { shelter_id, name, species, ...rest } = body

  if (!shelter_id || !name || !species) {
    return NextResponse.json({ error: 'shelter_id, name and species are required' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('animals')
    .insert({ shelter_id, name, species, ...rest })
    .select('id, name, social_post, status, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { animal: data, message: 'Animal created. Social post will be generated shortly.' },
    { status: 201 }
  )
}
