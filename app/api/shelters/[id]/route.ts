import { NextResponse } from 'next/server'

// GET /api/shelters/:id
// Returns public profile of a shelter — no auth required
// Contract: docs/api-contracts/f1-shelter-hub.md
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // TODO: replace with real Supabase query by shelter id
  return NextResponse.json({
    shelter: {
      id: params.id,
      name: "Refugio Patitas",
      description: "Somos una fundación dedicada al rescate y adopción responsable de animales en CDMX desde 2018.",
      city: "CDMX",
      address: "Colonia Roma Norte, CDMX",
      cover_photo: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800",
      instagram_url: "https://instagram.com/refugiopatitas",
      website_url: null,
      founded_year: 2018,
      stats: {
        total_animals: 23,
        available_animals: 18,
        total_adoptions: 142
      }
    }
  }, { status: 200 })
}
