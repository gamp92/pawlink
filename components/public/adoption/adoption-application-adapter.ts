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

type UnsupportedAdoptionField =
  | 'applicant.city'
  | 'household.living_space_other'
  | 'household.own_or_rent'
  | 'household.landlord_allows_pets'
  | 'household.household_size'
  | 'household.children_ages'
  | 'household.other_pets_details'
  | 'lifestyle.hours_pet_alone'
  | 'lifestyle.care_time'
  | 'lifestyle.travel_frequency'
  | 'adoption_intent.adoption_motivation'
  | 'adoption_intent.preferred_characteristics'
  | 'adoption_intent.can_cover_costs'
  | 'adoption_intent.willing_to_interview'
  | 'consents.truthful_information_confirmed'
  | 'consents.contact_consent'

type AdoptionApplicationApiMapping = {
  supportedPayload: CreateAdoptionRequestDto
  unsupportedFields: UnsupportedAdoptionField[]
}

export function mapAnonymousApplicationToApi(
  payload: AnonymousAdoptionApplicationPayload,
): AdoptionApplicationApiMapping {
  // TODO: Extend POST /api/adoption-requests when the backend is ready to store
  // the full anonymous questionnaire. These fields are intentionally surfaced by
  // the mapper so integration work does not accidentally drop frontend data.
  const unsupportedFields: UnsupportedAdoptionField[] = [
    'applicant.city',
    'household.own_or_rent',
    'household.landlord_allows_pets',
    'household.household_size',
    'lifestyle.hours_pet_alone',
    'lifestyle.care_time',
    'lifestyle.travel_frequency',
    'adoption_intent.adoption_motivation',
    'adoption_intent.preferred_characteristics',
    'adoption_intent.can_cover_costs',
    'adoption_intent.willing_to_interview',
    'consents.truthful_information_confirmed',
    'consents.contact_consent',
  ]

  if (payload.household.children_ages) unsupportedFields.push('household.children_ages')
  if (payload.household.other_pets_details) unsupportedFields.push('household.other_pets_details')

  const livingSpace = mapLivingSpace(payload.household.living_space)
  if (!livingSpace) unsupportedFields.push('household.living_space_other')

  const familyProfile: AdoptionRequestFamilyProfileDto = {
    ...(livingSpace && { living_space: livingSpace }),
    lifestyle: mapLifestyle(payload.lifestyle.activity_level),
    experience: payload.lifestyle.previous_pet_experience,
    has_other_pets: payload.household.has_other_pets,
    has_children: payload.household.has_children,
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
    unsupportedFields,
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

function mapLivingSpace(livingSpace: AnonymousAdoptionApplicationPayload['household']['living_space']): ApiLivingSpace | null {
  if (livingSpace === 'apartment') return 'apartment'
  if (livingSpace === 'house') return 'house_no_yard'
  return null
}

function mapLifestyle(activityLevel: AnonymousAdoptionApplicationPayload['lifestyle']['activity_level']): ApiLifestyle {
  if (activityLevel === 'low') return 'sedentary'
  if (activityLevel === 'high') return 'active'
  return 'moderate'
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
