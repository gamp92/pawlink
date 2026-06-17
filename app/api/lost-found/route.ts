import { NextResponse } from 'next/server'

// GET /api/lost-found
// Returns open lost/found reports for the map
// Contract: docs/api-contracts/f3-lost-found.md
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const report_type = searchParams.get('report_type')
  const status = searchParams.get('status') ?? 'open'

  // TODO: replace with real Supabase query — add PostGIS radius filter when lat/lng provided
  return NextResponse.json({
    reports: [
      {
        id: "rpt-0001",
        report_type: "lost",
        pet_name: "Max",
        species: "dog",
        breed: "Golden Retriever",
        color: "golden",
        description: "Last seen near Parque México wearing a red collar",
        photo_urls: ["https://images.unsplash.com/photo-1552053831-71594a27632d?w=400"],
        location: { lat: 19.4126, lng: -99.1740 },
        location_notes: "Near Parque México, Condesa",
        city: "CDMX",
        status: "open",
        matched_report_id: "rpt-0002",
        match_confidence: 89.3,
        created_at: "2025-06-09T00:00:00Z"
      },
      {
        id: "rpt-0002",
        report_type: "found",
        pet_name: null,
        species: "dog",
        breed: "Golden mix",
        color: "golden",
        description: "Found near Insurgentes, friendly and healthy",
        photo_urls: ["https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400"],
        location: { lat: 19.4150, lng: -99.1720 },
        location_notes: "Av. Insurgentes Sur, Roma Norte",
        city: "CDMX",
        status: "open",
        matched_report_id: "rpt-0001",
        match_confidence: 89.3,
        created_at: "2025-06-09T02:00:00Z"
      },
      {
        id: "rpt-0003",
        report_type: "lost",
        pet_name: "Coco",
        species: "cat",
        breed: "Orange tabby",
        color: "orange",
        description: "Missing since Tuesday, very friendly",
        photo_urls: ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400"],
        location: { lat: 19.4180, lng: -99.1760 },
        location_notes: "Colonia Condesa",
        city: "CDMX",
        status: "open",
        matched_report_id: null,
        match_confidence: null,
        created_at: "2025-06-08T00:00:00Z"
      }
    ],
    total: 3
  }, { status: 200 })
}

// POST /api/lost-found
// Submits a new lost or found report
// Contract: docs/api-contracts/f3-lost-found.md
export async function POST(request: Request) {
  const body = await request.json()

  // TODO: replace with real Supabase insert
  // Side effects (when real): N8N geo-alert + /api/vision auto-called
  return NextResponse.json({
    report: {
      id: "rpt-" + Math.random().toString(36).substr(2, 6),
      report_type: body.report_type,
      status: "open",
      created_at: new Date().toISOString()
    },
    message: "Report submitted. Nearby users will be alerted automatically."
  }, { status: 201 })
}
