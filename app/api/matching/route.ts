import { NextResponse } from 'next/server'

// POST /api/matching
// Receives family profile → returns animals ranked by AI compatibility score
// Contract: docs/api-contracts/f2-smart-adoption.md
export async function POST(request: Request) {
  const body = await request.json()

  // TODO: replace with real Groq API call
  // body.family_profile and body.filters will be used to call Groq
  return NextResponse.json({
    results: [
      {
        animal: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Luna",
          species: "dog",
          breed: "Golden mix",
          age_years: 2,
          photo_urls: ["https://images.unsplash.com/photo-1552053831-71594a27632d?w=400"],
          shelter: {
            id: "550e8400-e29b-41d4-a716-aaaaaaaaaaaa",
            name: "Refugio Patitas"
          }
        },
        compatibility_score: 94.5,
        compatibility_reasons: [
          "Calm temperament suitable for apartment living",
          "Known to be great with children",
          "Low exercise needs match your lifestyle"
        ]
      },
      {
        animal: {
          id: "550e8400-e29b-41d4-a716-446655440003",
          name: "Nala",
          species: "cat",
          breed: "Mixed",
          age_years: 3,
          photo_urls: ["https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400"],
          shelter: {
            id: "550e8400-e29b-41d4-a716-bbbbbbbbbbbb",
            name: "Hogar Animal"
          }
        },
        compatibility_score: 78.0,
        compatibility_reasons: [
          "Gentle and calm — good for moderate lifestyle",
          "Comfortable in smaller spaces",
          "Some experience with pets recommended"
        ]
      },
      {
        animal: {
          id: "550e8400-e29b-41d4-a716-446655440002",
          name: "Bruno",
          species: "dog",
          breed: "Labrador",
          age_years: 4,
          photo_urls: ["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"],
          shelter: {
            id: "550e8400-e29b-41d4-a716-aaaaaaaaaaaa",
            name: "Refugio Patitas"
          }
        },
        compatibility_score: 61.0,
        compatibility_reasons: [
          "High energy may be challenging in an apartment",
          "Good with children but needs more outdoor space"
        ]
      }
    ]
  }, { status: 200 })
}
