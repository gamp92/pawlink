import type { ReportType, Species } from '@/lib/mock-data'

export type LostFoundFlowStep = 'pet' | 'location' | 'review'
export type AlertFlowStep = 'contact' | 'location' | 'review'

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
  report_type: ReportType
  pet_name: string
  species: Species | ''
  breed: string
  color: string
  description: string
  location_notes: string
  city: string
  location: SelectedLocation | null
  // TODO: Re-enable photo selection only after the backend accepts permanent
  // Supabase Storage URLs during anonymous report submission.
  photos: SelectedPetPhoto[]
}

export type AnonymousLostFoundReportPayload = {
  report_type: ReportType
  pet_name?: string
  species: Species
  breed?: string
  color: string
  description: string
  location_notes: string
  city?: string
  location: {
    lat: number
    lng: number
  }
}

export type LostFoundReportSubmissionResult = {
  report_id: string
  status: 'open' | 'resolved' | string
  submitted_at: string
  message?: string
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
  city?: string
  location: {
    lat: number
    lng: number
  }
  radius_km: number
  email_consent: boolean
}

export type AlertSubscriptionResult = {
  subscription_id: string
  status: 'created'
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
  report_type: 'lost',
  pet_name: '',
  species: '',
  breed: '',
  color: '',
  description: '',
  location_notes: '',
  city: '',
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
