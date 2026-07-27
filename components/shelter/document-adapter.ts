export type UploadedDocument = {
  id: string
  file_name: string
  status: string
  created_at: string
}

export type DocumentUploadResult =
  | { ok: true; document: UploadedDocument }
  | { ok: false; error: string }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function getApiErrorMessage(payload: unknown, fallback: string) {
  if (!isObject(payload)) return fallback
  const apiError = payload as { error?: string; message?: string }
  return apiError.error || apiError.message || fallback
}

type UploadUrlResponse = {
  upload_url: string
  storage_path: string
}

function isUploadUrlResponse(value: unknown): value is UploadUrlResponse {
  return isObject(value) && typeof value.upload_url === 'string' && typeof value.storage_path === 'string'
}

async function requestUploadUrl(shelterId: string, file: File): Promise<UploadUrlResponse> {
  const response = await fetch('/api/uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content_type: file.type, context: 'document', shelter_id: shelterId }),
  })
  const body = await readJsonBody(response)

  if (!response.ok || !isUploadUrlResponse(body)) {
    throw new Error(getApiErrorMessage(body, `Could not prepare "${file.name}" for upload.`))
  }
  return body
}

async function putFile(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!response.ok) {
    throw new Error(`Could not upload "${file.name}". Please try again.`)
  }
}

function isUploadedDocument(value: unknown): value is UploadedDocument {
  return isObject(value) && typeof value.id === 'string' && typeof value.file_name === 'string'
}

async function registerDocument(shelterId: string, file: File, storagePath: string): Promise<UploadedDocument> {
  const response = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shelter_id: shelterId, file_name: file.name, storage_path: storagePath }),
  })
  const body = await readJsonBody(response)
  const document = isObject(body) ? body.document : null

  if (!response.ok || !isUploadedDocument(document)) {
    throw new Error(getApiErrorMessage(body, `Could not save "${file.name}".`))
  }
  return document
}

// Uploads one PDF directly to Supabase Storage via a signed URL
// (POST /api/uploads, context: 'document'), then registers it in
// shelter_documents (POST /api/documents) so the dashboard can list it.
// Not connected to the RAG assistant.
export async function uploadShelterDocument(shelterId: string, file: File): Promise<DocumentUploadResult> {
  try {
    const { upload_url, storage_path } = await requestUploadUrl(shelterId, file)
    await putFile(upload_url, file)
    const document = await registerDocument(shelterId, file, storage_path)
    return { ok: true, document }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not upload document. Please try again.',
    }
  }
}

export async function fetchShelterDocuments(shelterId: string): Promise<UploadedDocument[]> {
  const response = await fetch(`/api/documents?shelter_id=${encodeURIComponent(shelterId)}`, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(getApiErrorMessage(await readJsonBody(response), 'Could not load documents'))
  }
  const body = (await response.json()) as { documents?: UploadedDocument[] }
  return body.documents ?? []
}

export async function deleteShelterDocument(documentId: string): Promise<void> {
  const response = await fetch(`/api/documents/${documentId}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(getApiErrorMessage(await readJsonBody(response), 'Could not delete document'))
  }
}
