import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/animals/public
// Returns available animals across all shelters for the public gallery
// Contract: docs/api-contracts/f2-smart-adoption.md
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const species = searchParams.get('species')
  const size = searchParams.get('size')
  const energy_level = searchParams.get('energy_level')
  const good_with_kids = searchParams.get('good_with_kids')
  const good_with_pets = searchParams.get('good_with_pets')
  const shelter_id = searchParams.get('shelter_id')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const supabase = createServerClient()

  let query = supabase
    .from('animals')
    .select(`
      id, name, species, breed, age_years, size, gender, energy_level,
      good_with_kids, good_with_pets, photo_urls,
      shelters ( id, name, city )
    `, { count: 'exact' })
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (species) query = query.eq('species', species)
  if (size) query = query.eq('size', size)
  if (energy_level) query = query.eq('energy_level', energy_level)
  if (good_with_kids) query = query.eq('good_with_kids', good_with_kids === 'true')
  if (good_with_pets) query = query.eq('good_with_pets', good_with_pets === 'true')
  if (shelter_id) query = query.eq('shelter_id', shelter_id)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const animals = data.map((a: any) => ({
    id: a.id,
    name: a.name,
    species: a.species,
    breed: a.breed,
    age_years: a.age_years,
    size: a.size,
    gender: a.gender,
    energy_level: a.energy_level,
    good_with_kids: a.good_with_kids,
    good_with_pets: a.good_with_pets,
    photo_urls: a.photo_urls,
    shelter: a.shelters,
  }))

  return NextResponse.json({ animals, total: count, limit, offset }, { status: 200 })
}
