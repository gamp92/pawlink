import { NextResponse } from 'next/server'

// GET /api/rag/documents?shelter_id=...
// Proxies to pawlink-rag GET /documents (internal, needs X-Internal-Key) so the key stays server-side.
export async function GET(request: Request) {
  const ragUrl = process.env.RAG_SERVICE_URL
  const ragKey = process.env.RAG_INTERNAL_API_KEY

  if (!ragUrl || !ragKey) {
    return NextResponse.json({ error: 'RAG service is not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const shelterId = searchParams.get('shelter_id')
  if (!shelterId) {
    return NextResponse.json({ error: 'shelter_id is required' }, { status: 400 })
  }

  const upstream = await fetch(`${ragUrl}/documents?shelter_id=${encodeURIComponent(shelterId)}`, {
    headers: { 'X-Internal-Key': ragKey },
    cache: 'no-store',
  })

  const payload = await upstream.json().catch(() => ({ documents: [] }))
  return NextResponse.json(payload, { status: upstream.status })
}
