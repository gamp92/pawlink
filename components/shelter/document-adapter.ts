export type UploadedDocument = {
  id: string
  file_name: string
  status: string
  created_at: string
  chunk_count?: number | null
  error?: string | null
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
  const apiError = payload as { error?: string; message?: string; detail?: string }
  return apiError.error || apiError.message || apiError.detail || fallback
}

function isUploadedDocument(value: unknown): value is UploadedDocument {
  return isObject(value) && typeof value.id === 'string' && typeof value.file_name === 'string'
}

// Uploads one PDF to the RAG assistant service through the server-side proxy
// (POST /api/rag/ingest), which holds the internal key. The service answers 202
// and indexes in the background, so the document lands as 'processing'.
export async function uploadShelterDocument(shelterId: string, file: File): Promise<DocumentUploadResult> {
  const form = new FormData()
  form.append('shelter_id', shelterId)
  form.append('file', file, file.name)

  try {
    const response = await fetch('/api/rag/ingest', { method: 'POST', body: form })
    const body = await readJsonBody(response)
    const document = isObject(body) ? body.document : null

    if (!response.ok || !isUploadedDocument(document)) {
      throw new Error(getApiErrorMessage(body, `Could not upload "${file.name}".`))
    }
    return { ok: true, document }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not upload document. Please try again.',
    }
  }
}

export async function fetchShelterDocuments(shelterId: string): Promise<UploadedDocument[]> {
  const response = await fetch(`/api/rag/documents?shelter_id=${encodeURIComponent(shelterId)}`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(getApiErrorMessage(await readJsonBody(response), 'Could not load documents'))
  }
  const body = (await response.json()) as { documents?: UploadedDocument[] }
  return body.documents ?? []
}

export async function deleteShelterDocument(documentId: string): Promise<void> {
  const response = await fetch(`/api/rag/documents/${encodeURIComponent(documentId)}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(getApiErrorMessage(await readJsonBody(response), 'Could not delete document'))
  }
}
