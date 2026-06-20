import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const MATCH_THRESHOLD = 75

// POST /api/vision
// Compares two pet report photos using AWS Rekognition
// If confidence >= 75, updates both reports with matched_report_id and match_confidence
// Contract: docs/api-contracts/f3-lost-found.md
export async function POST(request: Request) {
  const body = await request.json()
  const { source_report_id, target_report_id } = body

  if (!source_report_id || !target_report_id) {
    return NextResponse.json(
      { error: 'source_report_id and target_report_id are required' },
      { status: 400 }
    )
  }

  if (
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_REGION
  ) {
    return NextResponse.json({ error: 'AWS credentials not configured' }, { status: 503 })
  }

  const supabase = createServerClient()

  const [sourceResult, targetResult] = await Promise.all([
    supabase
      .from('lost_found_reports')
      .select('id, photo_urls')
      .eq('id', source_report_id)
      .single(),
    supabase
      .from('lost_found_reports')
      .select('id, photo_urls')
      .eq('id', target_report_id)
      .single(),
  ])

  if (sourceResult.error || !sourceResult.data?.photo_urls?.[0]) {
    return NextResponse.json({ error: 'Source report not found or has no photo' }, { status: 404 })
  }
  if (targetResult.error || !targetResult.data?.photo_urls?.[0]) {
    return NextResponse.json({ error: 'Target report not found or has no photo' }, { status: 404 })
  }

  const sourceUrl = sourceResult.data.photo_urls[0]
  const targetUrl = targetResult.data.photo_urls[0]

  const rekognitionResult = await callRekognition(sourceUrl, targetUrl)

  if (!rekognitionResult.ok) {
    return NextResponse.json({ error: 'Rekognition API error' }, { status: 502 })
  }

  const confidence = rekognitionResult.confidence
  const is_match = confidence >= MATCH_THRESHOLD

  if (is_match) {
    await Promise.all([
      supabase
        .from('lost_found_reports')
        .update({ matched_report_id: target_report_id, match_confidence: confidence })
        .eq('id', source_report_id),
      supabase
        .from('lost_found_reports')
        .update({ matched_report_id: source_report_id, match_confidence: confidence })
        .eq('id', target_report_id),
    ])
  }

  return NextResponse.json(
    { match: { source_report_id, target_report_id, confidence, is_match } },
    { status: 200 }
  )
}

async function callRekognition(
  sourceUrl: string,
  targetUrl: string
): Promise<{ ok: boolean; confidence: number }> {
  const { AwsClient } = await import('aws4fetch')

  const aws = new AwsClient({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION!,
    service: 'rekognition',
  })

  const response = await aws.fetch(
    `https://rekognition.${process.env.AWS_REGION}.amazonaws.com/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'RekognitionService.CompareFaces',
      },
      body: JSON.stringify({
        SourceImage: { ExternalImageId: sourceUrl },
        TargetImage: { ExternalImageId: targetUrl },
        SimilarityThreshold: MATCH_THRESHOLD,
      }),
    }
  )

  if (!response.ok) return { ok: false, confidence: 0 }

  const data = await response.json()
  const topMatch = data.FaceMatches?.[0]
  const confidence = topMatch?.Similarity ?? 0

  return { ok: true, confidence }
}
