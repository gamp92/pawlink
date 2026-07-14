import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_URL = 'https://api.resend.com/emails'

// Triggered by Supabase Database Webhook on UPDATE to adoption_requests
// when status changes to 'approved' — sends confirmation email to family
Deno.serve(async (req: Request) => {
  const payload = await req.json()
  const request = payload.record
  const oldRequest = payload.old_record

  // Only fire when status changes to 'approved'
  if (request?.status !== 'approved' || oldRequest?.status === 'approved') {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 })
  }

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), { status: 503 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Contact info lives on the request row itself — no family_profiles table
  if (!request.email) {
    return new Response(JSON.stringify({ error: 'Request has no contact email' }), { status: 422 })
  }

  const [animalResult, shelterResult] = await Promise.all([
    supabase.from('animals').select('name, species, photo_urls').eq('id', request.animal_id).single(),
    supabase.from('shelters').select('name, phone, email').eq('id', request.shelter_id).single(),
  ])

  const animal = animalResult.data
  const shelter = shelterResult.data
  const species = animal?.species === 'dog' ? 'perro' : animal?.species === 'cat' ? 'gato' : 'mascota'

  const emailResponse = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Pawlink <adopciones@pawlink.mx>',
      to: request.email,
      subject: `🎉 ¡Tu solicitud de adopción fue aprobada!`,
      html: `
        <h2>¡Felicidades, ${request.full_name ?? ''}!</h2>
        <p>Tu solicitud para adoptar a <strong>${animal?.name}</strong> (${species}) fue <strong>aprobada</strong> por ${shelter?.name}.</p>
        <h3>Próximos pasos</h3>
        <p>El refugio se pondrá en contacto contigo pronto para coordinar la entrega.</p>
        <h3>Datos del refugio</h3>
        <ul>
          <li><strong>Nombre:</strong> ${shelter?.name}</li>
          ${shelter?.phone ? `<li><strong>Teléfono:</strong> ${shelter.phone}</li>` : ''}
          ${shelter?.email ? `<li><strong>Email:</strong> ${shelter.email}</li>` : ''}
        </ul>
        ${request.notes ? `<p><strong>Nota del refugio:</strong> ${request.notes}</p>` : ''}
        <p>Gracias por elegir adoptar. 🐾</p>
        <p><a href="https://pawlink-theta.vercel.app">Pawlink</a></p>
      `,
    }),
  })

  if (!emailResponse.ok) {
    return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 502 })
  }

  return new Response(
    JSON.stringify({ success: true, email_sent_to: request.email }),
    { status: 200 }
  )
})
