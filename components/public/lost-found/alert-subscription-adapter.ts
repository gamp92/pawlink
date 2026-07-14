import type {
  AlertSubscriptionAdapterResult,
  AnonymousAlertSubscriptionPayload,
} from '@/components/public/lost-found/types'

export async function submitAnonymousAlertSubscription(
  payload: AnonymousAlertSubscriptionPayload,
): Promise<AlertSubscriptionAdapterResult> {
  // TODO: Replace this temporary frontend adapter when the backend has an
  // anonymous alert subscription table/endpoint. Do not call
  // /api/lost-found/alert because that endpoint only tests existing report
  // radius lookups and cannot persist name/email/radius subscription data.
  await new Promise((resolve) => setTimeout(resolve, 700))

  return {
    ok: true,
    result: {
      subscription_id: `local-alert-${payload.radius_km}km-${Date.now()}`,
      status: 'created_locally',
      submitted_at: new Date().toISOString(),
    },
  }
}
