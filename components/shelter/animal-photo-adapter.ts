import type { SelectedAnimalPhoto } from '@/components/shelter/AnimalFormPanel'

export type AnimalPhotoUploadResult =
  | { ok: true; urls: string[] }
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
  public_url: string
}

function isUploadUrlResponse(value: unknown): value is UploadUrlResponse {
  return isObject(value) && typeof value.upload_url === 'string' && typeof value.public_url === 'string'
}

async function requestUploadUrl(file: File): Promise<UploadUrlResponse> {
  const response = await fetch('/api/uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_name: file.name, content_type: file.type, context: 'animal' }),
  })
  const body = await readJsonBody(response)

  if (!response.ok || !isUploadUrlResponse(body)) {
    throw new Error(getApiErrorMessage(body, `Could not prepare "${file.name}" for upload.`))
  }
  return body
}

async function uploadPhotoFile(photo: SelectedAnimalPhoto): Promise<string> {
  const { upload_url, public_url } = await requestUploadUrl(photo.file)

  const uploadResponse = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': photo.file.type },
    body: photo.file,
  })

  if (!uploadResponse.ok) {
    throw new Error(`Could not upload "${photo.file.name}". Please try again.`)
  }
  return public_url
}

// Uploads every selected photo directly to Supabase Storage via signed URLs
// (POST /api/uploads, context: 'animal') before the animal is created or updated.
export async function uploadAnimalPhotos(photos: SelectedAnimalPhoto[]): Promise<AnimalPhotoUploadResult> {
  if (photos.length === 0) return { ok: true, urls: [] }

  try {
    const urls = await Promise.all(photos.map(uploadPhotoFile))
    return { ok: true, urls }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Could not upload photos. Please try again.',
    }
  }
}
