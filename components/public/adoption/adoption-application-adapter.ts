import type {
  AdoptionApplicationResult,
  AnonymousAdoptionApplicationPayload,
} from '@/components/public/adoption/types'

export async function submitAnonymousAdoptionApplication(
  payload: AnonymousAdoptionApplicationPayload,
): Promise<AdoptionApplicationResult> {
  // Temporary frontend-only adapter. Replace this with POST /api/adoption-requests
  // once the backend accepts anonymous applicant/contact fields without family_id.
  await new Promise((resolve) => setTimeout(resolve, 850))

  return {
    application_id: `local-adoption-${payload.animal_id}-${Date.now()}`,
    status: 'submitted_for_review',
    submitted_at: new Date().toISOString(),
  }
}
