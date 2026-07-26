import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

const ALLOWED_CONTENT_TYPES_BY_CONTEXT: Record<string, string[]> = {
  'lost-found': ['image/jpeg', 'image/png', 'image/webp'],
  animal: ['image/jpeg', 'image/png', 'image/webp'],
  document: ['application/pdf'],
}

const FOLDER_BY_CONTEXT: Record<string, string> = {
  'lost-found': 'lost-found',
  animal: 'animals',
}

const BUCKET_BY_CONTEXT: Record<string, string> = {
  'lost-found': 'pets',
  animal: 'pets',
  document: 'documents',
}

const PUBLIC_BY_CONTEXT: Record<string, boolean> = {
  'lost-found': true,
  animal: true,
  document: false,
}

// Supabase signed upload URLs are valid for 2 hours (fixed by the storage API)
const UPLOAD_URL_TTL_SECONDS = 7200

interface UploadRequestBody {
  file_name?: string
  content_type: string
  context?: string
  shelter_id?: string
}

// POST /api/uploads
// Mints a single-use signed upload URL — the public `pets` bucket for photos
// (context: 'lost-found', default, or 'animal') or the private `documents`
// bucket for shelter PDFs (context: 'document', requires shelter_id). Each
// bucket enforces its own max size and mime types at upload time.
// Contract: docs/api-contracts/f3-lost-found.md
export async function POST(request: Request) {
  const body: Partial<UploadRequestBody> = await request.json().catch(() => ({}))

  const context = body.context ?? 'lost-found'
  if (typeof context !== 'string' || !Object.hasOwn(BUCKET_BY_CONTEXT, context)) {
    return NextResponse.json({ error: 'context must be lost-found, animal or document' }, { status: 400 })
  }

  const contentType = body.content_type
  const allowedContentTypes = ALLOWED_CONTENT_TYPES_BY_CONTEXT[context]
  if (typeof contentType !== 'string' || !allowedContentTypes.includes(contentType)) {
    return NextResponse.json(
      { error: `content_type must be one of: ${allowedContentTypes.join(', ')}` },
      { status: 400 }
    )
  }

  const validationError = validateUploadRequest(body, context)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const extension = EXTENSION_BY_CONTENT_TYPE[contentType]
  // Random server-side path — the user's file_name never reaches storage.
  // The 'document' context is shelter-scoped (a folder per shelter), unlike
  // the flat lost-found/animals folders used by the other two contexts.
  const path =
    context === 'document'
      ? `${body.shelter_id}/${crypto.randomUUID()}.${extension}`
      : `${FOLDER_BY_CONTEXT[context]}/${crypto.randomUUID()}.${extension}`
  const bucketName = BUCKET_BY_CONTEXT[context]
  const storage = createServerClient().storage.from(bucketName)

  const { data, error } = await storage.createSignedUploadUrl(path)

  if (error || !data) {
    return NextResponse.json({ error: 'Could not create upload URL' }, { status: 500 })
  }

  return NextResponse.json(
    {
      upload_url: data.signedUrl,
      public_url: PUBLIC_BY_CONTEXT[context] ? storage.getPublicUrl(path).data.publicUrl : null,
      storage_path: path,
      expires_in: UPLOAD_URL_TTL_SECONDS,
    },
    { status: 201 }
  )
}

function validateUploadRequest(body: Partial<UploadRequestBody>, context: string): string | null {
  if (body.file_name != null && (typeof body.file_name !== 'string' || body.file_name.length > 255)) {
    return 'file_name must be a string of up to 255 chars'
  }
  if (context === 'document' && (typeof body.shelter_id !== 'string' || body.shelter_id.length === 0)) {
    return 'shelter_id is required for context: document'
  }
  return null
}
