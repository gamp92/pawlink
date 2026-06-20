import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama3-8b-8192'

// POST /api/matching
// Receives family profile → fetches available animals → calls Groq once with all animals
// Returns animals ranked by compatibility score descending
// Contract: docs/api-contracts/f2-smart-adoption.md
export async function POST(request: Request) {
  const body = await request.json()
  const { shelter_id, family_profile, filters } = body

  if (!family_profile?.living_space || !family_profile?.lifestyle || !family_profile?.experience) {
    return NextResponse.json(
      { error: 'family_profile must include living_space, lifestyle and experience' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  let query = supabase
    .from('animals')
    .select(`
      id, name, species, breed, age_years, size, gender, energy_level,
      good_with_kids, good_with_pets, description, photo_urls,
      shelters ( id, name, city )
    `)
    .eq('status', 'available')
    .limit(30)

  if (shelter_id) query = query.eq('shelter_id', shelter_id)
  if (filters?.species) query = query.eq('species', filters.species)
  if (filters?.size) query = query.eq('size', filters.size)

  const { data: animals, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!animals || animals.length === 0) {
    return NextResponse.json({ results: [] }, { status: 200 })
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 503 })
  }

  const animalsForPrompt = animals.map((a: any) => ({
    id: a.id,
    name: a.name,
    species: a.species,
    breed: a.breed,
    age_years: a.age_years,
    size: a.size,
    energy_level: a.energy_level,
    good_with_kids: a.good_with_kids,
    good_with_pets: a.good_with_pets,
  }))

  const prompt = `You are an expert animal adoption counselor. Given a family profile and a list of available animals, score each animal's compatibility with the family from 0 to 100 and provide 2-3 short reasons.

Family profile:
- Living space: ${family_profile.living_space}
- Lifestyle: ${family_profile.lifestyle}
- Pet experience: ${family_profile.experience}
- Has children: ${family_profile.has_children ?? false}
- Has other pets: ${family_profile.has_other_pets ?? false}

Available animals:
${JSON.stringify(animalsForPrompt, null, 2)}

Respond ONLY with a valid JSON array, no extra text. Format:
[
  {
    "id": "animal-uuid",
    "compatibility_score": 94.5,
    "compatibility_reasons": ["reason 1", "reason 2", "reason 3"]
  }
]

Sort by compatibility_score descending.`

  const groqResponse = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  })

  if (!groqResponse.ok) {
    return NextResponse.json({ error: 'Groq API error' }, { status: 502 })
  }

  const groqData = await groqResponse.json()
  const content = groqData.choices?.[0]?.message?.content ?? '[]'

  let scores: { id: string; compatibility_score: number; compatibility_reasons: string[] }[]
  try {
    scores = JSON.parse(content)
  } catch {
    return NextResponse.json({ error: 'Failed to parse Groq response' }, { status: 502 })
  }

  const animalsById = Object.fromEntries(animals.map((a: any) => [a.id, a]))

  const results = scores
    .filter((s) => animalsById[s.id])
    .map((s) => ({
      animal: {
        id: s.id,
        name: animalsById[s.id].name,
        species: animalsById[s.id].species,
        breed: animalsById[s.id].breed,
        age_years: animalsById[s.id].age_years,
        photo_urls: animalsById[s.id].photo_urls,
        shelter: animalsById[s.id].shelters,
      },
      compatibility_score: s.compatibility_score,
      compatibility_reasons: s.compatibility_reasons,
    }))

  return NextResponse.json({ results }, { status: 200 })
}
