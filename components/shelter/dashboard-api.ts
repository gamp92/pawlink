import type { AdoptionRequest, Animal, AnimalStatus, Species } from '@/lib/mock-data'

export type ApiAnimal = {
  id: string
  name: string
  species: Species | null
  breed: string | null
  age_years: number | string | null
  size: Animal['size'] | null
  gender: Animal['gender'] | null
  color: string | null
  description: string | null
  energy_level: Animal['energy_level'] | null
  good_with_kids: boolean | null
  good_with_pets: boolean | null
  status: AnimalStatus | null
  photo_urls: string[] | null
  social_post: string | null
  created_at: string
}

export type ApiAdoptionRequest = {
  id: string
  status: AdoptionRequest['status'] | null
  compatibility_score: number | string | null
  compatibility_reasons: string[] | null
  notes?: string | null
  animal: AdoptionRequest['animal'] | null
  family: AdoptionRequest['family'] | null
  created_at: string
}

export type DashboardFetchResult<TData> = {
  data: TData
  error: string | null
  isFallback: boolean
  isEmpty: boolean
}

export type CreateAnimalPayload = {
  name: string
  species: Species
  breed: string
  age_years: number
  size: Animal['size']
  gender: Animal['gender']
  color: string
  description: string
  energy_level: Animal['energy_level']
  good_with_kids: boolean
  good_with_pets: boolean
  photo_urls: string[]
}

export type PatchAnimalPayload = Partial<
  Pick<
    Animal,
    | 'name'
    | 'species'
    | 'breed'
    | 'age_years'
    | 'size'
    | 'gender'
    | 'color'
    | 'description'
    | 'energy_level'
    | 'good_with_kids'
    | 'good_with_pets'
    | 'status'
    | 'photo_urls'
  >
>

export type PatchAdoptionRequestPayload = Pick<AdoptionRequest, 'status'> & {
  notes?: string
}

async function readApiError(response: Response, fallbackMessage: string) {
  try {
    const payload = (await response.json()) as { error?: string; message?: string }
    return payload.error ?? payload.message ?? fallbackMessage
  } catch {
    return fallbackMessage
  }
}

export function toAnimal(apiAnimal: ApiAnimal, shelter: Animal['shelter']): Animal {
  return {
    id: apiAnimal.id,
    name: apiAnimal.name,
    species: apiAnimal.species ?? 'other',
    breed: apiAnimal.breed ?? 'Mixed',
    age_years: Number(apiAnimal.age_years ?? 0),
    size: apiAnimal.size ?? 'medium',
    gender: apiAnimal.gender ?? 'female',
    status: apiAnimal.status ?? 'available',
    color: apiAnimal.color ?? 'unknown',
    description: apiAnimal.description ?? 'No description provided yet.',
    energy_level: apiAnimal.energy_level ?? 'medium',
    good_with_kids: Boolean(apiAnimal.good_with_kids),
    good_with_pets: Boolean(apiAnimal.good_with_pets),
    photo_urls: apiAnimal.photo_urls ?? [],
    social_post: apiAnimal.social_post,
    shelter,
    created_at: apiAnimal.created_at,
  }
}

export function toAdoptionRequest(apiRequest: ApiAdoptionRequest): AdoptionRequest {
  return {
    id: apiRequest.id,
    status: apiRequest.status ?? 'pending',
    notes: apiRequest.notes ?? undefined,
    compatibility_score: Number(apiRequest.compatibility_score ?? 0),
    compatibility_reasons: apiRequest.compatibility_reasons ?? [],
    animal: apiRequest.animal ?? { id: 'unknown-animal', name: 'Unknown pet', photo_urls: [] },
    family: apiRequest.family ?? {
      full_name: 'Unknown applicant',
      email: 'unknown@example.com',
      living_space: 'apartment',
      has_children: false,
      has_other_pets: false,
    },
    created_at: apiRequest.created_at,
  }
}

export async function fetchDashboardAnimals(
  shelterId: string,
  shelter: Animal['shelter'],
  fallbackAnimals: Animal[],
): Promise<DashboardFetchResult<Animal[]>> {
  try {
    const response = await fetch(`/api/animals?shelter_id=${encodeURIComponent(shelterId)}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(await readApiError(response, 'Could not load shelter animals'))
    }

    const payload = (await response.json()) as { animals?: ApiAnimal[] }
    const apiAnimals = payload.animals ?? []

    if (apiAnimals.length === 0) {
      return {
        data: [],
        error: null,
        isFallback: false,
        isEmpty: true,
      }
    }

    return {
      data: apiAnimals.map((animal) => toAnimal(animal, shelter)),
      error: null,
      isFallback: false,
      isEmpty: false,
    }
  } catch (error) {
    return {
      data: fallbackAnimals,
      error: error instanceof Error ? error.message : 'Animals API is unavailable. Showing fallback animals.',
      isFallback: true,
      isEmpty: fallbackAnimals.length === 0,
    }
  }
}

export async function fetchDashboardRequests(
  shelterId: string,
  fallbackRequests: AdoptionRequest[],
): Promise<DashboardFetchResult<AdoptionRequest[]>> {
  try {
    const response = await fetch(`/api/adoption-requests?shelter_id=${encodeURIComponent(shelterId)}`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(await readApiError(response, 'Could not load adoption requests'))
    }

    const payload = (await response.json()) as { requests?: ApiAdoptionRequest[] }
    const apiRequests = payload.requests ?? []

    if (apiRequests.length === 0) {
      return {
        data: [],
        error: null,
        isFallback: false,
        isEmpty: true,
      }
    }

    return {
      data: apiRequests.map(toAdoptionRequest),
      error: null,
      isFallback: false,
      isEmpty: false,
    }
  } catch (error) {
    return {
      data: fallbackRequests,
      error: error instanceof Error ? error.message : 'Adoption requests API is unavailable. Showing fallback requests.',
      isFallback: true,
      isEmpty: fallbackRequests.length === 0,
    }
  }
}

export async function patchAnimal(animalId: string, body: PatchAnimalPayload) {
  const response = await fetch(`/api/animals/${animalId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Could not update animal'))
  }

  return response.json()
}

export async function createAnimal(shelterId: string, animal: CreateAnimalPayload) {
  const response = await fetch('/api/animals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shelter_id: shelterId,
      ...animal,
    }),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Could not create animal'))
  }

  return response.json() as Promise<{ animal?: { id: string; name: string; status: AnimalStatus; created_at: string } }>
}

export async function patchAdoptionRequest(
  requestId: string,
  body: PatchAdoptionRequestPayload,
) {
  const response = await fetch(`/api/adoption-requests/${requestId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Could not update adoption request'))
  }

  return response.json()
}
