import { NextResponse } from 'next/server'

// DELETE /api/rag/documents/:id
// Proxies to pawlink-rag DELETE /documents/:id (internal, needs X-Internal-Key).
// Removes the document row and its chunks, so the assistant stops citing it.
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ragUrl = process.env.RAG_SERVICE_URL
  const ragKey = process.env.RAG_INTERNAL_API_KEY

  if (!ragUrl || !ragKey) {
    return NextResponse.json({ error: 'RAG service is not configured' }, { status: 500 })
  }

  const upstream = await fetch(`${ragUrl}/documents/${encodeURIComponent(params.id)}`, {
    method: 'DELETE',
    headers: { 'X-Internal-Key': ragKey },
    cache: 'no-store',
  }).catch(() => null)

  if (!upstream) {
    return NextResponse.json({ error: 'Could not reach the assistant service' }, { status: 502 })
  }

  const payload = await upstream.json().catch(() => ({}))
  return NextResponse.json(payload, { status: upstream.status })
}
