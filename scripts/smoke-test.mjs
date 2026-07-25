#!/usr/bin/env node
/**
 * Pawlink smoke test — exercises every backend endpoint against REAL
 * infrastructure (no mocks): Vercel Functions, Supabase (PostGIS + RLS),
 * Database Webhooks, Edge Functions and Groq.
 *
 * Usage:
 *   node scripts/smoke-test.mjs                        # against production
 *   node scripts/smoke-test.mjs http://localhost:3000  # against local dev
 *   node scripts/smoke-test.mjs --matching             # also test /api/matching
 *                                                      # (off by default: one call
 *                                                      # burns most of Groq's free
 *                                                      # tier 6k tokens/minute)
 *
 * How it uses the seed (scripts/seed.py):
 *   - Reads are checked against seeded rows (5 CDMX shelters, 50 animals,
 *     10 lost/found reports around Parque México). Ids are discovered through
 *     the public API itself — nothing is hardcoded.
 *   - The throwaway lost/found report is placed in central Madrid on purpose:
 *     the only seeded user within the 2 km geo-alert radius is
 *     test+madrid1@gmail.com (a team inbox alias), so the alert email reaches
 *     the team and nobody else.
 *   - The adoption request needs no account: contact info travels inline.
 *
 * Everything the script creates, it deletes. Two tables have no DELETE
 * endpoint (adoption_requests, lost_found_reports), so cleanup for those uses
 * the service role key from .env (NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY). Without .env those checks are skipped.
 */
import { readFileSync, existsSync } from 'node:fs'

const args = process.argv.slice(2)
const RUN_MATCHING = args.includes('--matching')
const BASE = (args.find((a) => a.startsWith('http')) ?? 'https://pawlink-theta.vercel.app').replace(/\/$/, '')
const NIL_UUID = '00000000-0000-0000-0000-000000000000'

const results = []

function record(ok, name, detail = '') {
  results.push({ ok, name })
  const mark = ok ? '  ✓' : '  ✗ FAIL'
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ''}`)
}

function skip(name, why) {
  console.log(`  ⊘  ${name} — skipped: ${why}`)
}

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  return { status: res.status, json: safeParse(text) }
}

function safeParse(text) {
  try { return JSON.parse(text) } catch { return null }
}

function loadDotEnv() {
  if (!existsSync('.env')) return {}
  const entries = readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
    .map((line) => line.split('=').map((part) => part.trim()))
  return Object.fromEntries(entries)
}

const env = loadDotEnv()
const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const hasServiceAccess = Boolean(SUPA_URL && SERVICE_KEY)

async function supaRest(method, pathAndQuery) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${pathAndQuery}`, {
    method,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  })
  return { status: res.status, json: safeParse(await res.text()) }
}

async function pollUntil(fn, timeoutMs = 30000, intervalMs = 3000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await fn()) return true
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
  }
  return false
}

// ── Read checks (seed data discovered via the public API) ──────────────────

async function checkReads() {
  console.log('\nLecturas (datos del seed):')
  const gallery = await api('GET', '/api/animals/public?limit=5')
  const animals = gallery.json?.animals ?? []
  record(gallery.status === 200 && animals.length > 0, 'GET /api/animals/public', `${animals.length} animales, total ${gallery.json?.total}`)

  const shelterId = animals[0]?.shelter?.id
  if (!shelterId) throw new Error('No seed data found — run scripts/seed.py first')

  const byShelter = await api('GET', `/api/animals?shelter_id=${shelterId}&status=available`)
  record(byShelter.status === 200 && Array.isArray(byShelter.json?.animals), 'GET /api/animals?shelter_id&status')

  const noShelter = await api('GET', '/api/animals')
  record(noShelter.status === 400, 'GET /api/animals sin shelter_id → 400')

  const shelter = await api('GET', `/api/shelters/${shelterId}`)
  record(shelter.status === 200 && shelter.json?.shelter?.stats != null, 'GET /api/shelters/[id] con stats', shelter.json?.shelter?.name)

  const missing = await api('GET', `/api/shelters/${NIL_UUID}`)
  record(missing.status === 404, 'GET /api/shelters/[id inexistente] → 404')

  const requests = await api('GET', `/api/adoption-requests?shelter_id=${shelterId}`)
  record(requests.status === 200, 'GET /api/adoption-requests?shelter_id')

  const reports = await api('GET', '/api/lost-found')
  record(reports.status === 200 && reports.json?.total > 0, 'GET /api/lost-found', `${reports.json?.total} reportes`)

  // Seed places several reports around Parque México (19.4117, -99.1727)
  const nearby = await api('GET', '/api/lost-found?lat=19.4117&lng=-99.1727&radius_m=3000')
  record(nearby.status === 200 && (nearby.json?.reports?.length ?? 0) > 0, 'GET /api/lost-found con radio PostGIS', `${nearby.json?.reports?.length} en 3km`)

  return { shelterId }
}

// ── Animal lifecycle: POST → social-post webhook → PATCH → DELETE ──────────

async function checkAnimalLifecycle(shelterId) {
  console.log('\nCiclo de vida de animal (dispara webhook social-post → Groq):')
  const created = await api('POST', '/api/animals', {
    shelter_id: shelterId, name: 'SMOKE-TEST-Animal', species: 'dog', breed: 'Mestizo',
    age_years: 2, size: 'small', gender: 'female', color: 'negro',
    description: 'Animal de smoke test, sera borrado.', energy_level: 'low', good_with_kids: true,
  })
  record(created.status === 201, 'POST /api/animals → 201')
  const animalId = created.json?.animal?.id
  if (!animalId) return

  try {
    const gotPost = await pollUntil(async () => {
      const list = await api('GET', `/api/animals?shelter_id=${shelterId}`)
      return list.json?.animals?.find((a) => a.id === animalId)?.social_post != null
    })
    record(gotPost, 'Webhook social-post generó el post (Groq)', gotPost ? '' : 'no llegó en 30s')

    const patched = await api('PATCH', `/api/animals/${animalId}`, { status: 'in_process' })
    record(patched.status === 200, 'PATCH /api/animals/[id] → 200')
  } finally {
    const deleted = await api('DELETE', `/api/animals/${animalId}`)
    record(deleted.status === 200, 'DELETE /api/animals/[id] → 200 (cleanup)')
  }
}

// ── Adoption request lifecycle (no account needed, inline contact) ────────

async function checkAdoptionLifecycle(shelterId) {
  console.log('\nCiclo de solicitud de adopción (sin cuenta):')
  if (!hasServiceAccess) return skip('solicitudes', 'sin service role para cleanup (la solicitud pendiente rompería el 409 en corridas futuras)')

  const gallery = await api('GET', `/api/animals/public?shelter_id=${shelterId}&limit=1`)
  const animalId = gallery.json?.animals?.[0]?.id
  const contact = { full_name: 'SMOKE Familia', email: 'test+smokeadopt@gmail.com', phone: '+52 55 0000 0000' }
  const created = await api('POST', '/api/adoption-requests', {
    animal_id: animalId, shelter_id: shelterId, ...contact,
    family_profile: { living_space: 'apartment', lifestyle: 'moderate', experience: 'some', has_other_pets: false, has_children: true },
    compatibility_score: 94.5, compatibility_reasons: ['Temperamento tranquilo', 'Buena con ninos'],
  })
  record(created.status === 201, 'POST /api/adoption-requests sin cuenta → 201')
  const requestId = created.json?.request?.id
  if (!requestId) return

  try {
    const duplicate = await api('POST', '/api/adoption-requests', { animal_id: animalId, shelter_id: shelterId, ...contact })
    record(duplicate.status === 409, 'POST duplicado (mismo email+animal pendiente) → 409')

    const noEmail = await api('POST', '/api/adoption-requests', { animal_id: animalId, shelter_id: shelterId, full_name: 'Sin Email' })
    record(noEmail.status === 400, 'POST sin email → 400')

    const list = await api('GET', `/api/adoption-requests?shelter_id=${shelterId}`)
    const found = list.json?.requests?.find((r) => r.id === requestId)
    record(found?.compatibility_score === 94.5, 'GET devuelve compatibility_score persistido', `score: ${found?.compatibility_score}`)
    record(found?.family?.email === contact.email && found?.family?.phone === contact.phone, 'GET devuelve contacto inline en family', found?.family?.email)

    const seen = await api('PATCH', `/api/adoption-requests/${requestId}`, { status: 'seen' })
    record(seen.status === 200, "PATCH a 'seen' → 200 (sin email: solo 'approved' lo manda)")

    const invalid = await api('PATCH', `/api/adoption-requests/${requestId}`, { status: 'invalido' })
    record(invalid.status === 400, 'PATCH status inválido → 400')
  } finally {
    const del = await supaRest('DELETE', `adoption_requests?id=eq.${requestId}`)
    record(del.status === 204, 'cleanup solicitud (via service role)')
  }
}

// ── Lost & Found lifecycle: POST (geo-alert) → alert debug → PATCH ──────────

async function checkLostFoundLifecycle() {
  console.log('\nCiclo de reporte Lost & Found (dispara webhook geo-alert):')
  const created = await api('POST', '/api/lost-found', {
    report_type: 'lost', species: 'dog', pet_name: 'SMOKE-Madrid', breed: 'Mestizo', color: 'negro',
    description: 'Smoke test geo-alert', location: { lat: 40.417, lng: -3.7035 },
    location_notes: 'Centro Madrid (smoke test)', city: 'Madrid',
  })
  record(created.status === 201, 'POST /api/lost-found (Madrid) → 201')
  const reportId = created.json?.report?.id
  if (!reportId) return

  try {
    const alert = await api('POST', '/api/lost-found/alert', { report_id: reportId, radius_m: 2000 })
    const emails = (alert.json?.alerted_users ?? []).map((u) => u.email)
    const onlyMadrid1 = emails.length === 1 && emails[0] === 'test+madrid1@gmail.com'
    record(onlyMadrid1, 'Radio 2km encuentra SOLO a test+madrid1 (madrid2 a 4km excluido)', emails.join(', '))

    const resolved = await api('PATCH', `/api/lost-found/${reportId}`, { status: 'resolved' })
    record(resolved.status === 200, "PATCH a 'resolved' → 200")
  } finally {
    if (hasServiceAccess) {
      const del = await supaRest('DELETE', `lost_found_reports?id=eq.${reportId}`)
      record(del.status === 204, 'cleanup reporte (via service role)')
    } else {
      skip('cleanup reporte', 'sin service role — quedó como resolved')
    }
  }
}

// ── Alert subscriptions: POST (upsert) → unsubscribe by token ───────────────

async function checkAlertSubscriptions() {
  console.log('\nSuscripciones a geo-alertas:')
  if (!hasServiceAccess) return skip('suscripciones', 'sin service role para leer el token y limpiar')

  const email = 'test+smokesub@gmail.com'
  const query = `alert_subscriptions?email=eq.${encodeURIComponent(email)}`
  // Mid-Atlantic point: far from every seeded report and subscriber
  const created = await api('POST', '/api/alert-subscriptions', {
    email, full_name: 'SMOKE Sub', city: 'smoke-test', location: { lat: 0, lng: -30 },
  })
  record(created.status === 201, 'POST /api/alert-subscriptions → 201')

  try {
    const again = await api('POST', '/api/alert-subscriptions', { email, location: { lat: 0.01, lng: -30 } })
    record(again.status === 201, 'POST mismo email actualiza la zona (upsert) → 201')

    const badEmail = await api('POST', '/api/alert-subscriptions', { email: 'no-es-email', location: { lat: 0, lng: 0 } })
    record(badEmail.status === 400, 'POST email inválido → 400')

    const badLocation = await api('POST', '/api/alert-subscriptions', { email, location: { lat: 95, lng: 0 } })
    record(badLocation.status === 400, 'POST lat fuera de rango → 400')

    const { json } = await supaRest('GET', `${query}&select=unsubscribe_token`)
    const token = json?.[0]?.unsubscribe_token
    record(Boolean(token), 'la suscripción existe y tiene token (via service role)')
    const unsub = await api('GET', `/api/alert-subscriptions/unsubscribe?token=${token}`)
    record(unsub.status === 200, 'GET unsubscribe con token → 200')

    const gone = await supaRest('GET', `${query}&select=id`)
    record((gone.json?.length ?? 0) === 0, 'la suscripción ya no existe tras unsubscribe')

    const unknownToken = await api('GET', `/api/alert-subscriptions/unsubscribe?token=${NIL_UUID}`)
    record(unknownToken.status === 404 && unknownToken.json?.error === 'Unknown token', 'unsubscribe token desconocido → 404 con error del endpoint')

    const noToken = await api('GET', '/api/alert-subscriptions/unsubscribe')
    record(noToken.status === 400, 'unsubscribe sin token → 400')
  } finally {
    await supaRest('DELETE', query)
  }
}

// ── Anonymous photo upload: signed URL → PUT real PNG → public URL ─────────

const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

async function checkPhotoUploads() {
  console.log('\nSubida anónima de fotos (signed URL):')
  const created = await api('POST', '/api/uploads', { file_name: 'smoke.png', content_type: 'image/png' })
  const shapeOk = created.status === 201 && Boolean(created.json?.upload_url) && Boolean(created.json?.public_url)
  record(shapeOk, 'POST /api/uploads → 201 con upload_url y public_url')
  if (!shapeOk) return

  const { upload_url, public_url } = created.json
  const storagePath = decodeURIComponent(new URL(public_url).pathname.split('/object/public/pets/')[1] ?? '')

  try {
    const uploaded = await fetch(upload_url, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: Buffer.from(TINY_PNG_BASE64, 'base64'),
    })
    record(uploaded.ok, 'PUT del archivo al upload_url → subida directa a Storage', `status ${uploaded.status}`)

    const publicRes = await fetch(public_url)
    const contentType = publicRes.headers.get('content-type') ?? ''
    record(publicRes.ok && contentType.startsWith('image/'), 'GET public_url sirve la imagen', contentType)

    const badType = await api('POST', '/api/uploads', { file_name: 'doc.pdf', content_type: 'application/pdf' })
    record(badType.status === 400, 'POST content_type no permitido → 400')
  } finally {
    if (hasServiceAccess && storagePath) {
      const del = await fetch(`${SUPA_URL}/storage/v1/object/pets/${storagePath}`, {
        method: 'DELETE',
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      })
      record(del.ok, 'cleanup foto subida (via service role)')
    } else {
      skip('cleanup foto', 'sin service role — quedó una foto smoke en el bucket')
    }
  }
}

// ── Vision + matching ───────────────────────────────────────────────────────

async function checkVision() {
  console.log('\nVision matching (AWS Rekognition):')
  // Self-contained: two throwaway reports with the SAME dog photo, placed in
  // the middle of the Atlantic so the geo-alert webhook finds nobody to email.
  const photo = 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600'
  const ocean = { location: { lat: 0, lng: -30 }, city: 'smoke-test', species: 'dog', photo_urls: [photo] }
  const a = await api('POST', '/api/lost-found', { report_type: 'lost', pet_name: 'SMOKE-VISION-A', ...ocean })
  const b = await api('POST', '/api/lost-found', { report_type: 'found', pet_name: 'SMOKE-VISION-B', ...ocean })
  const [sourceId, targetId] = [a.json?.report?.id, b.json?.report?.id]
  if (!sourceId || !targetId) return record(false, 'POST /api/vision', 'no se pudieron crear los reportes de prueba')

  try {
    const res = await api('POST', '/api/vision', { source_report_id: sourceId, target_report_id: targetId })
    if (res.status === 503) return record(true, 'POST /api/vision', '503: AWS pendiente (esperado hasta configurar credenciales)')
    const match = res.json?.match
    record(res.status === 200 && match?.is_match === true, 'POST /api/vision misma foto → match', `confidence: ${match?.confidence}`)
  } finally {
    await cleanupVisionReports([sourceId, targetId])
  }
}

async function cleanupVisionReports(ids) {
  if (!hasServiceAccess) return skip('cleanup reportes de vision', 'sin service role')
  const del = await supaRest('DELETE', `lost_found_reports?id=in.(${ids.join(',')})`)
  record(del.status === 204, 'cleanup reportes de vision (via service role)')
}

async function checkMatching() {
  console.log('\nMatching con IA (Groq — consume ~la mitad del presupuesto de tokens del minuto):')
  const res = await api('POST', '/api/matching', {
    family_profile: { living_space: 'apartment', lifestyle: 'moderate', experience: 'some', has_other_pets: false, has_children: true },
  })
  const top = res.json?.results?.[0]
  record(res.status === 200 && res.json?.results?.length > 0, 'POST /api/matching → 200 con resultados',
    top ? `top: ${top.animal?.name} — ${top.compatibility_score}%` : `status ${res.status} (429/502 puede ser rate limit del free tier)`)
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Pawlink smoke test → ${BASE}`)
  console.log(hasServiceAccess ? 'Service role: disponible (checks completos)' : 'Service role: NO disponible — se saltan solicitudes y cleanups directos')

  const { shelterId } = await checkReads()
  await checkAnimalLifecycle(shelterId)
  await checkAdoptionLifecycle(shelterId)
  await checkLostFoundLifecycle()
  await checkAlertSubscriptions()
  await checkPhotoUploads()
  await checkVision()
  if (RUN_MATCHING) await checkMatching()
  else skip('POST /api/matching', 'usa --matching para incluirlo (consume tokens de Groq)')

  const failed = results.filter((r) => !r.ok)
  console.log(`\nResultado: ${results.length - failed.length}/${results.length} checks OK`)
  if (failed.length > 0) {
    failed.forEach((f) => console.log(`  FALLÓ: ${f.name}`))
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Smoke test abortó:', error.message)
  process.exit(1)
})
