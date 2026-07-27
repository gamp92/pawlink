import type { Animal } from '@/lib/mock-data'

export type AdoptionApplicationStep = 'contact' | 'review'
export type LivingSpace = 'apartment' | 'house_no_yard' | 'house_yard'
export type Lifestyle = 'sedentary' | 'moderate' | 'active'
export type PetExperience = 'none' | 'some' | 'experienced'

export type AdoptionApplicationForm = {
  first_name: string
  last_name: string
  email: string
  phone: string
}

export type AdoptionFamilyProfile = {
  living_space: LivingSpace
  lifestyle: Lifestyle
  experience: PetExperience
  has_children: boolean
  has_other_pets: boolean
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
  }
  family_profile: AdoptionFamilyProfile
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
}
