import { createClient } from 'jsr:@supabase/supabase-js@2'

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const RESEND_API_URL = 'https://api.resend.com/emails'

// Sender must belong to a domain verified in Resend. Without a verified domain,
// only Resend's sandbox sender works — and it only delivers to the account owner.
const RESEND_FROM = Deno.env.get('RESEND_FROM') ?? 'Pawlink <onboarding@resend.dev>'

// Triggered by Supabase Database Webhook on UPDATE to lost_found_reports.
// POST /api/vision updates BOTH matched rows in separate UPDATE statements when
// a match is confirmed, so this webhook fires once per row — each firing checks
// only its OWN row's contact_email and notifies about the OTHER (matched) report.
// No cross-row coordination needed.
Deno.serve(async (req: Request) => {
  const payload = await req.json()
  const record = payload.record
  const oldRecord = payload.old_record

  // Only fire the moment matched_report_id first transitions from null to set
  if (!record?.matched_report_id || oldRecord?.matched_report_id) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 })
  }

  if (!record.contact_email) {
    return new Response(JSON.stringify({ skipped: true, reason: 'no contact_email on this report' }), { status: 200 })
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 503 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: matchedReport } = await supabase
    .from('lost_found_reports')
    .select('pet_name, species')
    .eq('id', record.matched_report_id)
    .single()

  const species = matchedReport?.species === 'dog' ? 'perro' : matchedReport?.species === 'cat' ? 'gato' : 'mascota'
  const petName = matchedReport?.pet_name || 'la mascota'

  const emailResponse = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: record.contact_email,
      subject: `¡Posible match para tu reporte!`,
      html: `
        <h2>¡Buenas noticias!</h2>
        <p>Encontramos un posible match para tu reporte: <strong>${escapeHtml(petName)}</strong> (${species}).</p>
        <p>Entra a Pawlink para ver el detalle y coordinar el reencuentro.</p>
        <p><a href="https://pawlink-theta.vercel.app/lost-found">Ver en Pawlink</a></p>
      `,
    }),
  })

  if (!emailResponse.ok) {
    const body = await emailResponse.text().catch(() => '(unreadable body)')
    console.error(`vision-match-notification: Resend rejected email to ${record.contact_email}: ${emailResponse.status} ${body}`)
    return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 502 })
  }

  return new Response(
    JSON.stringify({ success: true, email_sent_to: record.contact_email }),
    { status: 200 }
  )
})
