import { NextResponse } from 'next/server'

// POST /api/rag/query
// Proxies to the pawlink-rag service so the RAG_INTERNAL key never reaches the client.
// Contract: pawlink-rag POST /query (SSE) — see pawlink-rag/app/api/query.py
export async function POST(request: Request) {
  const ragUrl = process.env.RAG_SERVICE_URL
  const ragKey = process.env.RAG_INTERNAL_API_KEY

  if (!ragUrl) {
    return NextResponse.json({ error: 'RAG_SERVICE_URL is not configured' }, { status: 500 })
  }

  const body = await request.text()

  const upstream = await fetch(`${ragUrl}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(ragKey ? { 'X-Internal-Key': ragKey } : {}),
    },
    body,
  })

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '')
    return NextResponse.json(
      { error: 'RAG service error', detail },
      { status: upstream.status || 502 },
    )
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
