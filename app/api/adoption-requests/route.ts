import { NextResponse } from 'next/server'

// GET /api/adoption-requests
// Returns adoption requests for the authenticated shelter
// Contract: docs/api-contracts/f1-shelter-hub.md
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  // TODO: replace with real Supabase query filtered by shelter_id
  return NextResponse.json({
    requests: [
      {
        id: "req-0001",
        status: "pending",
        compatibility_score: 94.5,
        compatibility_reasons: ["Calm temperament", "Good with kids"],
        animal: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Luna",
          photo_urls: ["https://images.unsplash.com/photo-1552053831-71594a27632d?w=400"]
        },
        family: {
          full_name: "Ana García",
          email: "ana@email.com",
          living_space: "apartment",
          has_children: true,
          has_other_pets: false
        },
        created_at: "2025-06-09T00:00:00Z"
      },
      {
        id: "req-0002",
        status: "seen",
        compatibility_score: 78.0,
        compatibility_reasons: ["Moderate lifestyle match", "Has pet experience"],
        animal: {
          id: "550e8400-e29b-41d4-a716-446655440002",
          name: "Bruno",
          photo_urls: ["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"]
        },
        family: {
          full_name: "Carlos López",
          email: "carlos@email.com",
          living_space: "house_yard",
          has_children: false,
          has_other_pets: true
        },
        created_at: "2025-06-08T00:00:00Z"
      }
    ]
  }, { status: 200 })
}

// POST /api/adoption-requests
// Submits adoption request from family to shelter
// Contract: docs/api-contracts/f2-smart-adoption.md
export async function POST(request: Request) {
  const body = await request.json()

  // TODO: replace with real Supabase insert + N8N email trigger
  return NextResponse.json({
    request: {
      id: "req-" + Math.random().toString(36).substr(2, 6),
      status: "pending",
      animal_id: body.animal_id,
      shelter_id: body.shelter_id,
      created_at: new Date().toISOString()
    },
    message: "Request submitted. The shelter will contact you soon."
  }, { status: 201 })
}

// PATCH /api/adoption-requests/:id is in /api/adoption-requests/[id]/route.ts
