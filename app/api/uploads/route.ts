import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const FOLDER_BY_CONTEXT: Record<string, string> = {
  'lost-found': 'lost-found',
  animal: 'animals',
}

// Supabase signed upload URLs are valid for 2 hours (fixed by the storage API)
const UPLOAD_URL_TTL_SECONDS = 7200

interface UploadRequestBody {
  file_name?: string
  content_type: string
  context?: string
}

// POST /api/uploads
// Mints a single-use signed upload URL for the public `pets` bucket — used by
// anonymous lost/found reports (context: 'lost-found', default) and by the
// shelter dashboard's animal photos (context: 'animal'). The bucket itself
// enforces max size (5MB) and image mime types at upload time.
// Contract: docs/api-contracts/f3-lost-found.md
export async function POST(request: Request) {
  const body: Partial<UploadRequestBody> = await request.json().catch(() => ({}))

  const contentType = body.content_type
  if (typeof contentType !== 'string' || !Object.hasOwn(EXTENSION_BY_CONTENT_TYPE, contentType)) {
    return NextResponse.json(
      { error: 'content_type must be image/jpeg, image/png or image/webp' },
      { status: 400 }
    )
  }

  const context = body.context ?? 'lost-found'
  if (typeof context !== 'string' || !Object.hasOwn(FOLDER_BY_CONTEXT, context)) {
    return NextResponse.json({ error: 'context must be lost-found or animal' }, { status: 400 })
  }

  const validationError = validateUploadRequest(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const extension = EXTENSION_BY_CONTENT_TYPE[contentType]
  // Random server-side path — the user's file_name never reaches storage
  const path = `${FOLDER_BY_CONTEXT[context]}/${crypto.randomUUID()}.${extension}`
  const storage = createServerClient().storage.from('pets')

  const { data, error } = await storage.createSignedUploadUrl(path)

  if (error || !data) {
    return NextResponse.json({ error: 'Could not create upload URL' }, { status: 500 })
  }

  return NextResponse.json(
    {
      upload_url: data.signedUrl,
      public_url: storage.getPublicUrl(path).data.publicUrl,
      expires_in: UPLOAD_URL_TTL_SECONDS,
    },
    { status: 201 }
  )
}

function validateUploadRequest(body: Partial<UploadRequestBody>): string | null {
  if (body.file_name != null && (typeof body.file_name !== 'string' || body.file_name.length > 255)) {
    return 'file_name must be a string of up to 255 chars'
  }
  return null
}
