import type { ReportType, Species } from '@/lib/mock-data'

export type LostFoundFlowStep = 'reporter' | 'pet' | 'location' | 'photos' | 'review'
export type AlertFlowStep = 'contact' | 'location' | 'review'
export type PetSize = 'small' | 'medium' | 'large'
export type PetSex = 'female' | 'male' | 'unknown'

export type SelectedLocation = {
  lat: number
  lng: number
  label: string
  mapX: number
  mapY: number
}

export type SelectedPetPhoto = {
  id: string
  file: File
  previewUrl: string
}

export type LostFoundReportForm = {
  first_name: string
  last_name: string
  email: string
  phone: string
  contact_consent: boolean
  report_type: ReportType
  pet_name: string
  species: Species | ''
  breed: string
  color: string
  size: PetSize | ''
  sex: PetSex | ''
  description: string
  date_lost_or_seen: string
  location_notes: string
  location: SelectedLocation | null
  photos: SelectedPetPhoto[]
}

export type AnonymousLostFoundReportPayload = {
  reporter: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    contact_consent: boolean
  }
  incident: {
    report_type: ReportType
    pet_name?: string
    species: Species
    breed?: string
    color: string
    size: PetSize
    sex?: PetSex
    description: string
    date_lost_or_seen: string
    location_notes: string
    location: {
      lat: number
      lng: number
    }
  }
  photos: Array<{
    file_name: string
    file_type: string
    file_size: number
  }>
}

export type LostFoundReportSubmissionResult = {
  report_id: string
  status: 'received_for_review'
  submitted_at: string
}

export type LostFoundReportAdapterResult =
  | { ok: true; result: LostFoundReportSubmissionResult }
  | { ok: false; error: string }

export type AlertSubscriptionForm = {
  first_name: string
  last_name: string
  email: string
  location: SelectedLocation | null
  radius_km: string
  email_consent: boolean
}

export type AnonymousAlertSubscriptionPayload = {
  first_name: string
  last_name?: string
  email: string
  location: {
    lat: number
    lng: number
  }
  radius_km: number
  email_consent: boolean
}

export type AlertSubscriptionResult = {
  subscription_id: string
  status: 'created_locally'
  submitted_at: string
}

export type AlertSubscriptionAdapterResult =
  | { ok: true; result: AlertSubscriptionResult }
  | { ok: false; error: string }

export const defaultReportLocation: SelectedLocation = {
  lat: 19.4133,
  lng: -99.1718,
  label: 'Condesa community area',
  mapX: 48,
  mapY: 48,
}

export const initialLostFoundReportForm: LostFoundReportForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  contact_consent: false,
  report_type: 'lost',
  pet_name: '',
  species: '',
  breed: '',
  color: '',
  size: '',
  sex: '',
  description: '',
  date_lost_or_seen: '',
  location_notes: '',
  location: null,
  photos: [],
}

export const initialAlertSubscriptionForm: AlertSubscriptionForm = {
  first_name: '',
  last_name: '',
  email: '',
  location: null,
  radius_km: '2',
  email_consent: false,
}
