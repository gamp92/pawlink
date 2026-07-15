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

// Triggered by Supabase Database Webhook on INSERT into lost_found_reports table
// Finds nearby users via PostGIS and sends email alerts via Resend
Deno.serve(async (req: Request) => {
  const payload = await req.json()
  const report = payload.record

  if (!report?.id) {
    return new Response(JSON.stringify({ error: 'No report record in payload' }), { status: 400 })
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 503 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get nearby users via PostGIS function
  const { data: nearbyUsers, error } = await supabase.rpc('get_users_near_report', {
    report_id: report.id,
    radius_m: 2000,
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!nearbyUsers || nearbyUsers.length === 0) {
    return new Response(JSON.stringify({ success: true, alerted: 0 }), { status: 200 })
  }

  const reportType = report.report_type === 'lost' ? 'perdida' : 'encontrada'
  const species = report.species === 'dog' ? 'perro' : report.species === 'cat' ? 'gato' : 'mascota'
  const petName = report.pet_name ? `"${escapeHtml(report.pet_name)}"` : 'sin nombre'

  // Send email to each nearby user
  const emailPromises = nearbyUsers.map(
    (user: { email: string; distance_m: number; unsubscribe_token: string }) => {
      const unsubscribeUrl = `https://pawlink-theta.vercel.app/api/alert-subscriptions/unsubscribe?token=${user.unsubscribe_token}`
      return fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Pawlink <alertas@pawlink.mx>',
          to: user.email,
          subject: `🐾 ${report.report_type === 'lost' ? 'Mascota perdida' : 'Mascota encontrada'} cerca de ti`,
          html: `
            <h2>Reporte de mascota ${reportType} cerca de ti</h2>
            <p>Se reportó un <strong>${species}</strong> ${reportType} a <strong>${Math.round(user.distance_m)}m</strong> de tu ubicación.</p>
            <ul>
              <li><strong>Nombre:</strong> ${petName}</li>
              <li><strong>Especie:</strong> ${species}</li>
              ${report.breed ? `<li><strong>Raza:</strong> ${escapeHtml(report.breed)}</li>` : ''}
              ${report.color ? `<li><strong>Color:</strong> ${escapeHtml(report.color)}</li>` : ''}
              ${report.location_notes ? `<li><strong>Lugar:</strong> ${escapeHtml(report.location_notes)}</li>` : ''}
              ${report.description ? `<li><strong>Descripción:</strong> ${escapeHtml(report.description)}</li>` : ''}
            </ul>
            <p>Si tienes información, repórtalo en <a href="https://pawlink-theta.vercel.app/lost-found">Pawlink</a>.</p>
            <p style="font-size:12px;color:#888;">¿No quieres más alertas? <a href="${unsubscribeUrl}">Dejar de recibir alertas</a></p>
          `,
        }),
      })
    }
  )

  await Promise.allSettled(emailPromises)

  return new Response(
    JSON.stringify({ success: true, alerted: nearbyUsers.length }),
    { status: 200 }
  )
})
