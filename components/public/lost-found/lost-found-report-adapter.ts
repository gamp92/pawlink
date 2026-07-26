import type {
  AnonymousLostFoundReportPayload,
  LostFoundReportAdapterResult,
  LostFoundReportForm,
  SelectedPetPhoto,
} from '@/components/public/lost-found/types'
import type { ReportType, Species } from '@/lib/mock-data'

export type LostFoundReportApiPayload = {
  report_type: ReportType
  species: Species
  location: {
    lat: number
    lng: number
  }
  pet_name?: string
  breed?: string
  color: string
  description: string
  location_notes: string
  city?: string
  photo_urls?: string[]
}

export type LostFoundPhotoUploadResult =
  | { ok: true; urls: string[] }
  | { ok: false; error: string }

export type LostFoundReportApiResponse = {
  report?: {
    id?: string
    report_type?: ReportType
    status?: string
    created_at?: string
  }
  message?: string
}

export type LostFoundReportApiError = {
  error?: string
  message?: string
}

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
  const apiError = payload as LostFoundReportApiError
  return apiError.error || apiError.message || fallback
}

export function mapLostFoundReportToApi(form: LostFoundReportForm): AnonymousLostFoundReportPayload {
  if (!form.species || !form.location) {
    throw new Error('Missing required report details.')
  }

  // The current backend supports anonymous report essentials only. Reporter
  // contact, consent, size, sex, and date should return after the API/schema
  // can persist them without losing user-provided information.
  return {
    report_type: form.report_type,
    species: form.species,
    pet_name: form.pet_name.trim() || undefined,
    breed: form.breed.trim() || undefined,
    color: form.color.trim(),
    description: form.description.trim(),
    location_notes: form.location_notes.trim(),
    city: form.city.trim() || undefined,
    location: {
      lat: form.location.lat,
      lng: form.location.lng,
    },
  }
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
    body: JSON.stringify({ file_name: file.name, content_type: file.type }),
  })
  const body = await readJsonBody(response)

  if (!response.ok || !isUploadUrlResponse(body)) {
    throw new Error(getApiErrorMessage(body, `Could not prepare "${file.name}" for upload.`))
  }
  return body
}

async function uploadPhotoFile(photo: SelectedPetPhoto): Promise<string> {
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
// (POST /api/uploads) before the report is submitted with the resulting URLs.
export async function uploadReportPhotos(photos: SelectedPetPhoto[]): Promise<LostFoundPhotoUploadResult> {
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

export async function submitAnonymousLostFoundReport(
  payload: LostFoundReportApiPayload,
): Promise<LostFoundReportAdapterResult> {
  try {
    const response = await fetch('/api/lost-found', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const body = await readJsonBody(response)

    if (!response.ok) {
      return {
        ok: false,
        error: getApiErrorMessage(body, 'We could not submit the report. Please review the details and try again.'),
      }
    }

    const apiResponse = body as LostFoundReportApiResponse
    const reportId = apiResponse.report?.id

    if (!reportId) {
      return {
        ok: false,
        error: 'The report was submitted, but the server response was incomplete. Please refresh Lost & Found.',
      }
    }

    return {
      ok: true,
      result: {
        report_id: reportId,
        status: apiResponse.report?.status ?? 'open',
        submitted_at: apiResponse.report?.created_at ?? new Date().toISOString(),
        message: apiResponse.message,
      },
    }
  } catch {
    return {
      ok: false,
      error: 'Network error while submitting the report. Please check your connection and try again.',
    }
  }
}
