import { NextResponse } from 'next/server'

// POST /api/rag/ingest
// Proxies a shelter PDF to pawlink-rag POST /ingest (internal, needs X-Internal-Key)
// so the key stays server-side. Body is multipart/form-data: shelter_id + file.
export async function POST(request: Request) {
  const ragUrl = process.env.RAG_SERVICE_URL
  const ragKey = process.env.RAG_INTERNAL_API_KEY

  if (!ragUrl || !ragKey) {
    return NextResponse.json({ error: 'RAG service is not configured' }, { status: 500 })
  }

  const form = await request.formData().catch(() => null)
  if (!form) {
    return NextResponse.json({ error: 'multipart/form-data body is required' }, { status: 400 })
  }

  const shelterId = form.get('shelter_id')
  const file = form.get('file')

  if (typeof shelterId !== 'string' || shelterId.length === 0) {
    return NextResponse.json({ error: 'shelter_id is required' }, { status: 400 })
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  const upstreamForm = new FormData()
  upstreamForm.append('shelter_id', shelterId)
  upstreamForm.append('file', file, file.name)

  const upstream = await fetch(`${ragUrl}/ingest`, {
    method: 'POST',
    headers: { 'X-Internal-Key': ragKey },
    body: upstreamForm,
    cache: 'no-store',
  }).catch(() => null)

  if (!upstream) {
    return NextResponse.json({ error: 'Could not reach the assistant service' }, { status: 502 })
  }

  const payload = await upstream.json().catch(() => ({ error: 'Invalid response from the assistant service' }))
  return NextResponse.json(payload, { status: upstream.status })
}
