import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

interface RegisterDocumentBody {
  shelter_id?: string
  file_name?: string
  storage_path?: string
}

// POST /api/documents
// Registers a document row after the client's direct PUT to the signed
// upload URL (POST /api/uploads, context: 'document') has succeeded.
// Contract: docs/api-contracts/f1-shelter-hub.md
export async function POST(request: Request) {
  const body: Partial<RegisterDocumentBody> = await request.json().catch(() => ({}))

  const validationError = validateRegisterBody(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('shelter_documents')
    .insert({
      shelter_id: body.shelter_id,
      file_name: body.file_name,
      storage_path: body.storage_path,
    })
    .select('id, file_name, status, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ document: data }, { status: 201 })
}

function validateRegisterBody(body: Partial<RegisterDocumentBody>): string | null {
  if (typeof body.shelter_id !== 'string') return 'shelter_id is required'
  if (typeof body.file_name !== 'string' || body.file_name.length === 0 || body.file_name.length > 255) {
    return 'file_name is required, up to 255 chars'
  }
  if (typeof body.storage_path !== 'string' || body.storage_path.length === 0) {
    return 'storage_path is required'
  }
  return null
}

// GET /api/documents?shelter_id=
// Lists a shelter's uploaded documents, newest first.
// Contract: docs/api-contracts/f1-shelter-hub.md
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shelterId = searchParams.get('shelter_id')

  if (!shelterId) {
    return NextResponse.json({ error: 'shelter_id is required' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error, count } = await supabase
    .from('shelter_documents')
    .select('id, file_name, status, created_at', { count: 'exact' })
    .eq('shelter_id', shelterId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ documents: data ?? [], total: count ?? data?.length ?? 0 }, { status: 200 })
}
