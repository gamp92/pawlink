import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/shelters/:id
// Returns public profile of a shelter — no auth required
// Contract: docs/api-contracts/f1-shelter-hub.md
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  const [shelterResult, animalsResult] = await Promise.all([
    supabase
      .from('shelters')
      .select('id, name, description, city, address, cover_photo, instagram_url, website_url, founded_year')
      .eq('id', params.id)
      .single(),
    supabase
      .from('animals')
      .select('status')
      .eq('shelter_id', params.id),
  ])

  if (shelterResult.error) {
    if (shelterResult.error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Shelter not found' }, { status: 404 })
    }
    return NextResponse.json({ error: shelterResult.error.message }, { status: 500 })
  }

  const animals = animalsResult.data ?? []
  const stats = {
    total_animals: animals.length,
    available_animals: animals.filter((a: any) => a.status === 'available').length,
    total_adoptions: animals.filter((a: any) => a.status === 'adopted').length,
  }

  return NextResponse.json({ shelter: { ...shelterResult.data, stats } }, { status: 200 })
}
