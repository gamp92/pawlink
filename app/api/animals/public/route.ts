import { NextResponse } from 'next/server'

// GET /api/animals/public
// Returns all available animals across all shelters (public — Find a pet gallery)
// Contract: docs/api-contracts/f2-smart-adoption.md
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const species = searchParams.get('species')
  const size = searchParams.get('size')

  // TODO: replace with real Supabase query with filters
  return NextResponse.json({
    animals: [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Luna",
        species: "dog",
        breed: "Golden mix",
        age_years: 2,
        size: "medium",
        gender: "female",
        energy_level: "high",
        good_with_kids: true,
        good_with_pets: false,
        photo_urls: ["https://images.unsplash.com/photo-1552053831-71594a27632d?w=400"],
        shelter: {
          id: "550e8400-e29b-41d4-a716-aaaaaaaaaaaa",
          name: "Refugio Patitas",
          city: "CDMX"
        }
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Mochi",
        species: "cat",
        breed: "Siamese",
        age_years: 1,
        size: "small",
        gender: "male",
        energy_level: "low",
        good_with_kids: false,
        good_with_pets: true,
        photo_urls: ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400"],
        shelter: {
          id: "550e8400-e29b-41d4-a716-aaaaaaaaaaaa",
          name: "Refugio Patitas",
          city: "CDMX"
        }
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        name: "Bruno",
        species: "dog",
        breed: "Labrador",
        age_years: 4,
        size: "large",
        gender: "male",
        energy_level: "high",
        good_with_kids: true,
        good_with_pets: true,
        photo_urls: ["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"],
        shelter: {
          id: "550e8400-e29b-41d4-a716-aaaaaaaaaaaa",
          name: "Refugio Patitas",
          city: "CDMX"
        }
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        name: "Nala",
        species: "cat",
        breed: "Mixed",
        age_years: 3,
        size: "small",
        gender: "female",
        energy_level: "medium",
        good_with_kids: true,
        good_with_pets: false,
        photo_urls: ["https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400"],
        shelter: {
          id: "550e8400-e29b-41d4-a716-bbbbbbbbbbbb",
          name: "Hogar Animal",
          city: "CDMX"
        }
      }
    ],
    total: 47,
    limit: 20,
    offset: 0
  }, { status: 200 })
}
