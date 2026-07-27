import type {
  AdoptionApplicationResult,
  AnonymousAdoptionApplicationPayload,
} from '@/components/public/adoption/types'

type ApiLivingSpace = 'apartment' | 'house_no_yard' | 'house_yard'
type ApiLifestyle = 'sedentary' | 'moderate' | 'active'
type ApiExperience = 'none' | 'some' | 'experienced'

type AdoptionRequestFamilyProfileDto = {
  living_space?: ApiLivingSpace
  lifestyle?: ApiLifestyle
  experience?: ApiExperience
  has_other_pets?: boolean
  has_children?: boolean
}

type CreateAdoptionRequestDto = {
  animal_id: string
  shelter_id: string
  full_name: string
  email: string
  phone?: string
  family_profile?: AdoptionRequestFamilyProfileDto
  compatibility_score?: number
  compatibility_reasons?: string[]
}

type CreateAdoptionRequestResponseDto = {
  request: {
    id: string
    status: string
    animal_id: string
    shelter_id: string
    created_at: string
  }
  message: string
}

type AdoptionApplicationApiMapping = {
  supportedPayload: CreateAdoptionRequestDto
}

export function mapAnonymousApplicationToApi(
  payload: AnonymousAdoptionApplicationPayload,
): AdoptionApplicationApiMapping {
  const familyProfile: AdoptionRequestFamilyProfileDto = {
    living_space: payload.family_profile.living_space,
    lifestyle: payload.family_profile.lifestyle,
    experience: payload.family_profile.experience,
    has_other_pets: payload.family_profile.has_other_pets,
    has_children: payload.family_profile.has_children,
  }

  return {
    supportedPayload: {
      animal_id: payload.animal_id,
      shelter_id: payload.shelter_id,
      full_name: `${payload.applicant.first_name} ${payload.applicant.last_name}`.trim(),
      email: payload.applicant.email,
      ...(payload.applicant.phone && { phone: payload.applicant.phone }),
      family_profile: familyProfile,
      compatibility_score: payload.compatibility_score,
      compatibility_reasons: payload.compatibility_reasons,
    },
  }
}

export async function submitAnonymousAdoptionApplication(
  payload: AnonymousAdoptionApplicationPayload,
): Promise<AdoptionApplicationResult> {
  const { supportedPayload } = mapAnonymousApplicationToApi(payload)
  const response = await fetch('/api/adoption-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(supportedPayload),
  })

  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(getApiErrorMessage(body, response.status))
  }

  const data = parseCreateAdoptionRequestResponse(body)

  return {
    application_id: data.request.id,
    status: 'submitted_for_review',
    submitted_at: data.request.created_at,
  }
}

function getApiErrorMessage(body: unknown, status: number): string {
  if (isObject(body) && typeof body.error === 'string') return body.error
  if (status === 409) return 'You already have a pending request for this animal.'
  if (status >= 500) return 'The shelter request service is unavailable. Please try again.'
  return 'Could not submit the application. Please review your information and try again.'
}

function parseCreateAdoptionRequestResponse(body: unknown): CreateAdoptionRequestResponseDto {
  if (!isObject(body) || !isObject(body.request)) {
    throw new Error('The adoption request service returned an unexpected response.')
  }

  const { request } = body
  if (
    typeof request.id !== 'string' ||
    typeof request.status !== 'string' ||
    typeof request.animal_id !== 'string' ||
    typeof request.shelter_id !== 'string' ||
    typeof request.created_at !== 'string'
  ) {
    throw new Error('The adoption request service returned incomplete request details.')
  }

  return {
    request: {
      id: request.id,
      status: request.status,
      animal_id: request.animal_id,
      shelter_id: request.shelter_id,
      created_at: request.created_at,
    },
    message: isObject(body) && typeof body.message === 'string' ? body.message : '',
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
