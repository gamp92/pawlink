import type {
  AlertSubscriptionAdapterResult,
  AnonymousAlertSubscriptionPayload,
} from '@/components/public/lost-found/types'

export type AlertSubscriptionApiPayload = {
  email: string
  full_name?: string
  city?: string
  location: {
    lat: number
    lng: number
  }
}

export type AlertSubscriptionApiResponse = {
  subscription: {
    id: string
    email: string
    created_at: string
  }
  message: string
}

export type AlertSubscriptionApiError = {
  error: string
}

type UnsupportedAlertSubscriptionField =
  | 'radius_km'
  | 'email_consent'

type AlertSubscriptionApiMapping = {
  supportedPayload: AlertSubscriptionApiPayload
  unsupportedFields: UnsupportedAlertSubscriptionField[]
}

export function mapAlertSubscriptionToApi(
  payload: AnonymousAlertSubscriptionPayload,
): AlertSubscriptionApiMapping {
  // TODO: Extend POST /api/alert-subscriptions if product needs configurable
  // alert radius or persisted consent auditing. The backend currently stores
  // one email + point subscription and geo-alerts use the server-side radius.
  return {
    supportedPayload: {
      email: payload.email,
      full_name: [payload.first_name, payload.last_name].filter(Boolean).join(' '),
      ...(payload.city && { city: payload.city }),
      location: payload.location,
    },
    unsupportedFields: ['radius_km', 'email_consent'],
  }
}

export async function submitAnonymousAlertSubscription(
  payload: AnonymousAlertSubscriptionPayload,
): Promise<AlertSubscriptionAdapterResult> {
  const { supportedPayload } = mapAlertSubscriptionToApi(payload)

  try {
    const response = await fetch('/api/alert-subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supportedPayload),
    })

    const body: unknown = await response.json().catch(() => null)

    if (!response.ok) {
      return { ok: false, error: getApiErrorMessage(body, response.status) }
    }

    let data: AlertSubscriptionApiResponse
    try {
      data = parseAlertSubscriptionResponse(body)
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'The alert service returned an unexpected response.',
      }
    }

    return {
      ok: true,
      result: {
        subscription_id: data.subscription.id,
        status: 'created',
        submitted_at: data.subscription.created_at,
      },
    }
  } catch {
    return {
      ok: false,
      error: 'We could not save your alert preference. Please check your connection and try again.',
    }
  }
}

function getApiErrorMessage(body: unknown, status: number): string {
  if (isApiError(body)) return body.error
  if (status === 409) return 'This email already has an alert preference. We can update it when you try again.'
  if (status === 400) return 'Please review your email and selected location, then try again.'
  if (status >= 500) return 'The alert service is unavailable right now. Please try again shortly.'
  return 'Could not save your alert preference. Please try again.'
}

function parseAlertSubscriptionResponse(body: unknown): AlertSubscriptionApiResponse {
  if (!isObject(body) || !isObject(body.subscription)) {
    throw new Error('The alert service returned an unexpected response.')
  }

  const { subscription } = body
  if (
    typeof subscription.id !== 'string' ||
    typeof subscription.email !== 'string' ||
    typeof subscription.created_at !== 'string'
  ) {
    throw new Error('The alert service returned incomplete subscription details.')
  }

  return {
    subscription: {
      id: subscription.id,
      email: subscription.email,
      created_at: subscription.created_at,
    },
    message: typeof body.message === 'string' ? body.message : '',
  }
}

function isApiError(body: unknown): body is AlertSubscriptionApiError {
  return isObject(body) && typeof body.error === 'string'
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
