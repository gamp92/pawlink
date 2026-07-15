import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/lost-found
// Returns lost/found reports — supports radius filter via PostGIS
// Contract: docs/api-contracts/f3-lost-found.md
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'open'
  const report_type = searchParams.get('report_type')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius_m = searchParams.get('radius_m') ?? '5000'
  const limit = parseInt(searchParams.get('limit') ?? '50')

  const supabase = createServerClient()

  // If lat/lng provided, use PostGIS radius filter via RPC
  if (lat && lng) {
    const { data, error } = await supabase.rpc('get_reports_near_point', {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      radius_m: parseFloat(radius_m),
      filter_status: status,
      filter_type: report_type,
      result_limit: limit,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reports: data ?? [], total: data?.length ?? 0 }, { status: 200 })
  }

  // No geo filter — return all matching reports
  let query = supabase
    .from('lost_found_reports')
    .select('id, report_type, pet_name, species, breed, color, description, photo_urls, location, location_notes, city, status, matched_report_id, match_confidence, created_at')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (report_type) query = query.eq('report_type', report_type)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // PostGIS returns location as WKB — parse to {lat, lng}
  const reports = (data ?? []).map((r: any) => ({
    ...r,
    location: parseLocation(r.location),
  }))

  return NextResponse.json({ reports, total: count ?? reports.length }, { status: 200 })
}

// POST /api/lost-found
// Creates a new report — Supabase Database Webhook triggers geo-alert Edge Function
// Contract: docs/api-contracts/f3-lost-found.md
export async function POST(request: Request) {
  const body = await request.json()
  const { report_type, species, location, ...rest } = body

  // typeof check, not truthiness: lat/lng of 0 (equator/Greenwich) are valid
  if (!report_type || !species || typeof location?.lat !== 'number' || typeof location?.lng !== 'number') {
    return NextResponse.json(
      { error: 'report_type, species and location (lat, lng) are required' },
      { status: 400 }
    )
  }

  if (!['lost', 'found'].includes(report_type)) {
    return NextResponse.json({ error: "report_type must be 'lost' or 'found'" }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('lost_found_reports')
    .insert({
      report_type,
      species,
      location: `POINT(${location.lng} ${location.lat})`,
      ...rest,
    })
    .select('id, report_type, status, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    { report: data, message: 'Report submitted. Nearby users will be alerted automatically.' },
    { status: 201 }
  )
}

function parseLocation(location: any): { lat: number; lng: number } | null {
  if (!location) return null
  // Supabase returns geography as GeoJSON when using .select()
  if (location.coordinates) {
    return { lat: location.coordinates[1], lng: location.coordinates[0] }
  }
  return location
}
