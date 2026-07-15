import type { Animal, Species } from '@/lib/mock-data'

export type MatchingApiFamilyProfile = {
  living_space: 'apartment' | 'house_no_yard' | 'house_yard'
  lifestyle: 'sedentary' | 'moderate' | 'active'
  experience: 'none' | 'some' | 'experienced'
  has_children: boolean
  has_other_pets: boolean
}

export type MatchingApiFilters = {
  species?: Species
  size?: Animal['size']
}

export type MatchingApiPayload = {
  shelter_id?: string
  family_profile: MatchingApiFamilyProfile
  filters?: MatchingApiFilters
}

export type MatchingApiAnimalResult = {
  animal: {
    id: string
    name: string
    species: Species
    breed: string | null
    age_years: number | null
    photo_urls: string[] | null
    shelter: {
      id: string
      name: string
      city?: string | null
    } | null
  }
  compatibility_score: number
  compatibility_reasons: string[]
}

export type MatchingApiResponse = {
  results: MatchingApiAnimalResult[]
}

export type MatchingApiError = {
  error: string
}

export type MatchingRequestResult =
  | { ok: true; data: MatchingApiResponse }
  | { ok: false; message: string; status?: number }

export function mapMatchingFilters(filters: {
  species: 'all' | Species
  size: 'all' | Animal['size']
}): MatchingApiFilters | undefined {
  const supportedFilters: MatchingApiFilters = {}

  if (filters.species !== 'all') supportedFilters.species = filters.species
  if (filters.size !== 'all') supportedFilters.size = filters.size

  return Object.keys(supportedFilters).length > 0 ? supportedFilters : undefined
}

function isMatchingApiResponse(value: unknown): value is MatchingApiResponse {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { results?: unknown }
  if (!Array.isArray(candidate.results)) return false

  return candidate.results.every((result) => {
    if (!result || typeof result !== 'object') return false
    const item = result as Partial<MatchingApiAnimalResult>
    return (
      item.animal !== null &&
      typeof item.animal === 'object' &&
      typeof item.animal.id === 'string' &&
      typeof item.compatibility_score === 'number' &&
      Array.isArray(item.compatibility_reasons) &&
      item.compatibility_reasons.every((reason) => typeof reason === 'string')
    )
  })
}

function friendlyMatchingError(status?: number, message?: string) {
  if (status === 400) return message || 'Some match profile fields need attention.'
  if (status === 503) return 'Smart matching is temporarily unavailable.'
  if (status && status >= 500) return 'Smart matching could not finish right now.'
  return message || 'Smart matching is unavailable right now.'
}

export async function requestSmartMatches(
  payload: MatchingApiPayload,
  options: { signal?: AbortSignal } = {},
): Promise<MatchingRequestResult> {
  try {
    const response = await fetch('/api/matching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: options.signal,
    })

    let body: unknown = null
    try {
      body = await response.json()
    } catch {
      return { ok: false, status: response.status, message: 'Smart matching returned an unreadable response.' }
    }

    if (!response.ok) {
      const apiError = body as Partial<MatchingApiError>
      return {
        ok: false,
        status: response.status,
        message: friendlyMatchingError(response.status, apiError.error),
      }
    }

    if (!isMatchingApiResponse(body)) {
      return { ok: false, status: response.status, message: 'Smart matching returned an unexpected response.' }
    }

    return { ok: true, data: body }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ok: false, message: 'Smart matching was cancelled.' }
    }

    return { ok: false, message: 'Network issue while updating smart matches.' }
  }
}
