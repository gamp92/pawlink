import { createClient } from 'jsr:@supabase/supabase-js@2'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama3-8b-8192'

// Triggered by Supabase Database Webhook on INSERT into animals table
// Generates a social media post via Groq and saves it to animals.social_post
Deno.serve(async (req: Request) => {
  const payload = await req.json()
  const animal = payload.record

  if (!animal?.id) {
    return new Response(JSON.stringify({ error: 'No animal record in payload' }), { status: 400 })
  }

  const groqKey = Deno.env.get('GROQ_API_KEY')
  if (!groqKey) {
    return new Response(JSON.stringify({ error: 'GROQ_API_KEY not set' }), { status: 503 })
  }

  const prompt = `Write a warm, engaging social media post in Spanish for a pet shelter to help this animal get adopted. Keep it under 150 words, use 2-3 emojis, and end with a call to action to contact the shelter.

Animal details:
- Name: ${animal.name}
- Species: ${animal.species === 'dog' ? 'Perro' : animal.species === 'cat' ? 'Gato' : 'Animal'}
- Breed: ${animal.breed ?? 'Mestizo'}
- Age: ${animal.age_years} years
- Size: ${animal.size}
- Gender: ${animal.gender === 'male' ? 'Macho' : 'Hembra'}
- Energy level: ${animal.energy_level}
- Good with kids: ${animal.good_with_kids ? 'Yes' : 'No'}
- Good with pets: ${animal.good_with_pets ? 'Yes' : 'No'}
- Description: ${animal.description ?? ''}

Write only the post text, no extra commentary.`

  const groqResponse = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })

  if (!groqResponse.ok) {
    return new Response(JSON.stringify({ error: 'Groq API error' }), { status: 502 })
  }

  const groqData = await groqResponse.json()
  const socialPost = groqData.choices?.[0]?.message?.content?.trim()

  if (!socialPost) {
    return new Response(JSON.stringify({ error: 'Empty response from Groq' }), { status: 502 })
  }

  // Save to Supabase
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { error } = await supabase
    .from('animals')
    .update({ social_post: socialPost })
    .eq('id', animal.id)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true, animal_id: animal.id }), { status: 200 })
})
