import type { Animal } from '@/lib/mock-data'

export type AdoptionApplicationStep = 'contact' | 'household' | 'lifestyle' | 'intent' | 'review'
export type LivingSpace = 'apartment' | 'house' | 'other'
export type OwnRent = 'own' | 'rent'
export type ActivityLevel = 'low' | 'moderate' | 'high'
export type TravelFrequency = 'rarely' | 'sometimes' | 'often'
export type PetExperience = 'none' | 'some' | 'experienced'

export type AdoptionApplicationForm = {
  first_name: string
  last_name: string
  email: string
  phone: string
  city: string
  living_space: LivingSpace | ''
  own_or_rent: OwnRent | ''
  landlord_allows_pets: boolean | null
  household_size: string
  has_children: boolean | null
  children_ages: string
  has_other_pets: boolean | null
  other_pets_details: string
  activity_level: ActivityLevel | ''
  hours_pet_alone: string
  care_time: string
  travel_frequency: TravelFrequency | ''
  previous_pet_experience: PetExperience | ''
  adoption_motivation: string
  preferred_characteristics: string
  can_cover_costs: boolean
  willing_to_interview: boolean
  truthful_information_confirmed: boolean
  contact_consent: boolean
}

export type AnonymousAdoptionApplicationPayload = {
  animal_id: string
  shelter_id: string
  compatibility_score: number
  compatibility_reasons: string[]
  applicant: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    city: string
  }
  household: {
    living_space: LivingSpace
    own_or_rent: OwnRent
    landlord_allows_pets: boolean | null
    household_size: number
    has_children: boolean
    children_ages?: string
    has_other_pets: boolean
    other_pets_details?: string
  }
  lifestyle: {
    activity_level: ActivityLevel
    hours_pet_alone: number
    care_time: string
    travel_frequency: TravelFrequency
    previous_pet_experience: PetExperience
  }
  adoption_intent: {
    adoption_motivation: string
    preferred_characteristics: string
    can_cover_costs: boolean
    willing_to_interview: boolean
  }
  consents: {
    truthful_information_confirmed: boolean
    contact_consent: boolean
  }
}

export type AdoptionApplicationResult = {
  application_id: string
  status: 'submitted_for_review'
  submitted_at: string
}

export type SelectedAdoptionMatch = {
  animal: Animal
  score: number
  reasons: string[]
}

export type AdoptionStepProps = {
  form: AdoptionApplicationForm
  errors: Partial<Record<keyof AdoptionApplicationForm, string>>
  updateField: <Field extends keyof AdoptionApplicationForm>(
    field: Field,
    value: AdoptionApplicationForm[Field],
  ) => void
}

export const initialAdoptionApplicationForm: AdoptionApplicationForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  city: '',
  living_space: '',
  own_or_rent: '',
  landlord_allows_pets: null,
  household_size: '',
  has_children: null,
  children_ages: '',
  has_other_pets: null,
  other_pets_details: '',
  activity_level: '',
  hours_pet_alone: '',
  care_time: '',
  travel_frequency: '',
  previous_pet_experience: '',
  adoption_motivation: '',
  preferred_characteristics: '',
  can_cover_costs: false,
  willing_to_interview: false,
  truthful_information_confirmed: false,
  contact_consent: false,
}
