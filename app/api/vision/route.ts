import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const MATCH_THRESHOLD = 75

// Labels present in almost every pet photo — excluded from scoring so that two
// unrelated animals of the same species don't score high on generic overlap.
// Species mismatch (dog vs cat) short-circuits the score to 0 before this.
const GENERIC_LABELS = new Set([
  'Animal', 'Mammal', 'Pet', 'Canine', 'Feline', 'Dog', 'Cat', 'Carnivore',
])

interface DetectedLabel {
  readonly name: string
  readonly confidence: number
}

interface LabelResult {
  readonly ok: boolean
  readonly labels: DetectedLabel[]
}

// POST /api/vision
// Compares two pet report photos using AWS Rekognition DetectLabels.
// (CompareFaces only works on human faces — for pets we label both photos and
// score the confidence-weighted overlap of specific labels like breed/color.)
// If confidence >= 75, updates both reports with matched_report_id and match_confidence.
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

  const [sourceLabels, targetLabels] = await Promise.all([
    detectLabels(sourceResult.data.photo_urls[0]),
    detectLabels(targetResult.data.photo_urls[0]),
  ])

  if (!sourceLabels.ok || !targetLabels.ok) {
    return NextResponse.json({ error: 'Rekognition API error' }, { status: 502 })
  }

  const confidence = compareLabelSets(sourceLabels.labels, targetLabels.labels)
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

async function detectLabels(imageUrl: string): Promise<LabelResult> {
  const image = await fetch(imageUrl)
  if (!image.ok) return { ok: false, labels: [] }

  const bytes = Buffer.from(await image.arrayBuffer()).toString('base64')
  const response = await rekognitionRequest({
    Image: { Bytes: bytes },
    MaxLabels: 15,
    MinConfidence: 70,
  })
  if (!response.ok) return { ok: false, labels: [] }

  const data = await response.json()
  const labels = (data.Labels ?? []).map(
    (label: { Name: string; Confidence: number }): DetectedLabel => ({
      name: label.Name,
      confidence: label.Confidence,
    })
  )
  return { ok: true, labels }
}

async function rekognitionRequest(payload: object): Promise<Response> {
  const { AwsClient } = await import('aws4fetch')
  const aws = new AwsClient({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION!,
    service: 'rekognition',
  })
  return aws.fetch(`https://rekognition.${process.env.AWS_REGION}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'RekognitionService.DetectLabels',
    },
    body: JSON.stringify(payload),
  })
}

// Confidence-weighted overlap of specific labels, 0-100.
function compareLabelSets(source: DetectedLabel[], target: DetectedLabel[]): number {
  if (isSpeciesMismatch(source, target)) return 0
  return weightedJaccard(specificLabelMap(source), specificLabelMap(target))
}

function isSpeciesMismatch(source: DetectedLabel[], target: DetectedLabel[]): boolean {
  const species = (labels: DetectedLabel[]) => ({
    dog: labels.some((l) => l.name === 'Dog'),
    cat: labels.some((l) => l.name === 'Cat'),
  })
  const a = species(source)
  const b = species(target)
  return (a.dog && !b.dog && b.cat) || (a.cat && !b.cat && b.dog)
}

function specificLabelMap(labels: DetectedLabel[]): Map<string, number> {
  const entries = labels
    .filter((label) => !GENERIC_LABELS.has(label.name))
    .map((label): [string, number] => [label.name, label.confidence])
  return new Map(entries)
}

function weightedJaccard(source: Map<string, number>, target: Map<string, number>): number {
  const names = new Set([...source.keys(), ...target.keys()])
  let intersection = 0
  let union = 0
  for (const name of names) {
    intersection += Math.min(source.get(name) ?? 0, target.get(name) ?? 0)
    union += Math.max(source.get(name) ?? 0, target.get(name) ?? 0)
  }
  if (union === 0) return 0
  return Math.round((100 * intersection) / union * 10) / 10
}
