import { NextResponse } from 'next/server'

// POST /api/vision
// Compares two pet photos using AWS Rekognition
// Contract: docs/api-contracts/f3-lost-found.md
export async function POST(request: Request) {
  const body = await request.json()

  // TODO: replace with real AWS Rekognition call
  // Real implementation:
  // 1. Fetch photo_urls from both reports in Supabase
  // 2. Call Rekognition CompareFaces with source + target images
  // 3. If confidence >= 75, update both reports with matched_report_id + match_confidence
  return NextResponse.json({
    match: {
      source_report_id: body.source_report_id,
      target_report_id: body.target_report_id,
      confidence: 89.3,
      is_match: true
    }
  }, { status: 200 })
}
