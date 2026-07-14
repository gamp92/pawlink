import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface AlertSubscriptionBody {
  email: string
  full_name?: string
  city?: string
  location: { lat: number; lng: number }
}

// POST /api/alert-subscriptions
// Subscribes an email to lost/found alerts around a map point — no account needed.
// One row per email: posting again moves the subscription zone (upsert).
// Contract: docs/api-contracts/f3-lost-found.md
export async function POST(request: Request) {
  const body: Partial<AlertSubscriptionBody> = await request.json()
  const validationError = validateSubscription(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const { email, full_name, city, location } = body as AlertSubscriptionBody
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('alert_subscriptions')
    .upsert(
      {
        email: email.toLowerCase(),
        full_name,
        city,
        location: `POINT(${location.lng} ${location.lat})`,
      },
      { onConflict: 'email' }
    )
    .select('id, email, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Could not save subscription' }, { status: 500 })
  }

  return NextResponse.json(
    { subscription: data, message: "Subscribed. You'll get an email when a pet is reported near you." },
    { status: 201 }
  )
}

function validateSubscription(body: Partial<AlertSubscriptionBody>): string | null {
  if (typeof body?.email !== 'string' || body.email.length > 255 || !EMAIL_PATTERN.test(body.email)) {
    return 'a valid email is required'
  }
  if (typeof body.location?.lat !== 'number' || typeof body.location?.lng !== 'number') {
    return 'location (lat, lng) is required'
  }
  return validateOptionalFields(body)
}

function validateOptionalFields(body: Partial<AlertSubscriptionBody>): string | null {
  const { lat, lng } = body.location as { lat: number; lng: number }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return 'location out of range'
  if (body.full_name != null && (typeof body.full_name !== 'string' || body.full_name.length > 120)) {
    return 'full_name must be a string of up to 120 chars'
  }
  if (body.city != null && (typeof body.city !== 'string' || body.city.length > 120)) {
    return 'city must be a string of up to 120 chars'
  }
  return null
}
