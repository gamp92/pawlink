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

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (rest.contact_email != null && (typeof rest.contact_email !== 'string' || !EMAIL_PATTERN.test(rest.contact_email) || rest.contact_email.length > 255)) {
    return NextResponse.json({ error: 'contact_email must be a valid email address' }, { status: 400 })
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

  if (Array.isArray(rest.photo_urls) && rest.photo_urls.length > 0) {
    try {
      await attemptAutoMatch(request, supabase, data.id)
    } catch {
      // Vision matching is best-effort — report creation must succeed regardless.
    }
  }

  return NextResponse.json(
    { report: data, message: 'Report submitted. Nearby users will be alerted automatically.' },
    { status: 201 }
  )
}

// Vercel Functions have a 10s budget and each comparison costs a real
// Rekognition round trip, so this only checks a few candidates — the closest
// open reports of the same species and the opposite type (get_vision_match_
// candidates does the species/type/photo filtering and distance ordering in
// SQL), not an exhaustive scan of every open report.
const MAX_MATCH_CANDIDATES = 3

async function attemptAutoMatch(
  request: Request,
  supabase: ReturnType<typeof createServerClient>,
  reportId: string
): Promise<void> {
  const { data: candidates } = await supabase.rpc('get_vision_match_candidates', {
    report_id: reportId,
    result_limit: MAX_MATCH_CANDIDATES,
  })

  const origin = new URL(request.url).origin
  for (const candidate of candidates ?? []) {
    if (await tryVisionMatch(origin, reportId, candidate.id)) return
  }
}

async function tryVisionMatch(origin: string, sourceId: string, targetId: string): Promise<boolean> {
  try {
    const response = await fetch(`${origin}/api/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_report_id: sourceId, target_report_id: targetId }),
    })
    if (!response.ok) return false
    const body = await response.json()
    return Boolean(body?.match?.is_match)
  } catch {
    return false
  }
}

interface GeoPoint {
  lat: number
  lng: number
}

function parseLocation(location: unknown): GeoPoint | null {
  if (!location) return null
  if (typeof location === 'string') return parseWkbHexPoint(location)
  if (typeof location !== 'object') return null

  const value = location as { coordinates?: unknown; lat?: unknown; lng?: unknown }
  if (Array.isArray(value.coordinates)) {
    const [lng, lat] = value.coordinates.map(Number)
    return isFiniteCoordinate(lat, lng) ? { lat, lng } : null
  }
  if (typeof value.lat === 'number' && typeof value.lng === 'number') {
    return isFiniteCoordinate(value.lat, value.lng) ? { lat: value.lat, lng: value.lng } : null
  }
  return null
}

// PostgREST serializes geography columns as (E)WKB hex — e.g.
// "0101000020E6100000<lng><lat>" — NOT GeoJSON. For a 2D point the layout is
// fixed: 1-byte order, 4-byte type (bit 0x20000000 = SRID present), optional
// 4-byte SRID, then two 8-byte doubles (lng first, then lat).
const WKB_POINT_TYPE = 1
const WKB_SRID_FLAG = 0x20000000

function parseWkbHexPoint(hex: string): GeoPoint | null {
  if (!/^(?:[0-9a-fA-F]{42}|[0-9a-fA-F]{50})$/.test(hex)) return null

  const bytes = Buffer.from(hex, 'hex')
  const littleEndian = bytes[0] === 1
  const type = littleEndian ? bytes.readUInt32LE(1) : bytes.readUInt32BE(1)
  if ((type & 0xff) !== WKB_POINT_TYPE) return null

  const offset = (type & WKB_SRID_FLAG) !== 0 ? 9 : 5
  if (bytes.length < offset + 16) return null
  const lng = littleEndian ? bytes.readDoubleLE(offset) : bytes.readDoubleBE(offset)
  const lat = littleEndian ? bytes.readDoubleLE(offset + 8) : bytes.readDoubleBE(offset + 8)
  return isFiniteCoordinate(lat, lng) ? { lat, lng } : null
}

function isFiniteCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}
