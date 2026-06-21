'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimalCard } from '@/components/shared/AnimalCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { animals, type Animal, type Species } from '@/lib/mock-data'

type LivingSpace = 'apartment' | 'house_no_yard' | 'house_yard'
type Lifestyle = 'sedentary' | 'moderate' | 'active'
type Experience = 'none' | 'some' | 'experienced'
type SizeFilter = 'all' | Animal['size']
type EnergyFilter = 'all' | Animal['energy_level']
type SpeciesFilter = 'all' | Species

type FamilyProfile = {
  living_space: LivingSpace
  lifestyle: Lifestyle
  experience: Experience
  has_children: boolean
  has_other_pets: boolean
}

type Filters = {
  species: SpeciesFilter
  size: SizeFilter
  energy_level: EnergyFilter
  good_with_kids: boolean
  good_with_pets: boolean
}

type MatchResult = {
  animal: Animal
  score: number
  reasons: string[]
}

const availableAnimals = animals.filter((animal) => animal.status === 'available')

const initialProfile: FamilyProfile = {
  living_space: 'apartment',
  lifestyle: 'moderate',
  experience: 'some',
  has_children: true,
  has_other_pets: false,
}

const initialFilters: Filters = {
  species: 'all',
  size: 'all',
  energy_level: 'all',
  good_with_kids: false,
  good_with_pets: false,
}

function scoreAnimal(animal: Animal, profile: FamilyProfile): MatchResult {
  let score = 50
  const reasons: string[] = []

  if (profile.living_space === 'apartment') {
    if (animal.size !== 'large') {
      score += 18
      reasons.push('Comfortable size for apartment living')
    } else {
      score -= 12
      reasons.push('Large size may need more space')
    }
  }

  if (profile.living_space === 'house_yard') {
    if (animal.energy_level === 'high' || animal.size === 'large') {
      score += 16
      reasons.push('Yard matches higher activity needs')
    } else {
      score += 6
      reasons.push('Home setup gives this pet room to settle')
    }
  }

  if (profile.lifestyle === 'sedentary') {
    if (animal.energy_level === 'low') {
      score += 18
      reasons.push('Low energy level fits a quiet rhythm')
    } else if (animal.energy_level === 'high') {
      score -= 16
      reasons.push('High exercise needs may be demanding')
    }
  }

  if (profile.lifestyle === 'moderate') {
    if (animal.energy_level === 'medium') {
      score += 16
      reasons.push('Moderate energy is a natural lifestyle fit')
    } else {
      score += 4
      reasons.push('Care routine is manageable with planning')
    }
  }

  if (profile.lifestyle === 'active' && animal.energy_level === 'high') {
    score += 18
    reasons.push('Active lifestyle supports daily exercise')
  }

  if (profile.experience === 'none') {
    if (animal.energy_level === 'low' || animal.size === 'small') {
      score += 12
      reasons.push('Beginner-friendly care profile')
    } else {
      score -= 8
      reasons.push('May require more handling experience')
    }
  }

  if (profile.experience === 'experienced') {
    score += animal.energy_level === 'high' || animal.size === 'large' ? 12 : 6
    reasons.push('Experience helps with training and transition')
  }

  if (profile.has_children) {
    if (animal.good_with_kids) {
      score += 18
      reasons.push('Known to be good with children')
    } else {
      score -= 18
      reasons.push('Not currently marked as kid-friendly')
    }
  }

  if (profile.has_other_pets) {
    if (animal.good_with_pets) {
      score += 14
      reasons.push('Good fit for homes with other pets')
    } else {
      score -= 14
      reasons.push('May need to be the only pet')
    }
  }

  const boundedScore = Math.max(32, Math.min(98, score))

  return {
    animal,
    score: boundedScore,
    reasons: reasons.slice(0, 3),
  }
}

function matchesFilters(result: MatchResult, filters: Filters) {
  const { animal } = result
  if (filters.species !== 'all' && animal.species !== filters.species) return false
  if (filters.size !== 'all' && animal.size !== filters.size) return false
  if (filters.energy_level !== 'all' && animal.energy_level !== filters.energy_level) return false
  if (filters.good_with_kids && !animal.good_with_kids) return false
  if (filters.good_with_pets && !animal.good_with_pets) return false
  return true
}

export function SmartAdoption() {
  const [profile, setProfile] = useState<FamilyProfile>(initialProfile)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [selectedId, setSelectedId] = useState(availableAnimals[0]?.id ?? '')
  const [requestedAnimalId, setRequestedAnimalId] = useState<string | null>(null)

  const matchResults = useMemo(
    () =>
      availableAnimals
        .map((animal) => scoreAnimal(animal, profile))
        .filter((result) => matchesFilters(result, filters))
        .sort((a, b) => b.score - a.score),
    [filters, profile],
  )

  useEffect(() => {
    if (!matchResults.some((result) => result.animal.id === selectedId)) {
      setSelectedId(matchResults[0]?.animal.id ?? '')
      setRequestedAnimalId(null)
    }
  }, [matchResults, selectedId])

  const selectedMatch = matchResults.find((result) => result.animal.id === selectedId) ?? matchResults[0]

  function updateProfile<Key extends keyof FamilyProfile>(key: Key, value: FamilyProfile[Key]) {
    setProfile((current) => ({ ...current, [key]: value }))
    setRequestedAnimalId(null)
  }

  function updateFilters<Key extends keyof Filters>(key: Key, value: Filters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }))
    setRequestedAnimalId(null)
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_170px]">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">Find your match</h2>
            <p className="mt-1 text-xs text-slate-500">
              Filter available animals and tune the family profile to update local match scores.
            </p>
          </div>
          <StatusBadge label={`${matchResults.length} matches`} tone="purple" />
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={filters.species}
              onChange={(event) => updateFilters('species', event.target.value as SpeciesFilter)}
              className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">All species</option>
              <option value="dog">Dogs</option>
              <option value="cat">Cats</option>
              <option value="other">Other</option>
            </select>

            <select
              value={filters.size}
              onChange={(event) => updateFilters('size', event.target.value as SizeFilter)}
              className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">All sizes</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>

            <select
              value={filters.energy_level}
              onChange={(event) => updateFilters('energy_level', event.target.value as EnergyFilter)}
              className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">Any energy</option>
              <option value="low">Low energy</option>
              <option value="medium">Medium energy</option>
              <option value="high">High energy</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => updateFilters('good_with_kids', !filters.good_with_kids)}
              className={`rounded-full border px-3 py-1 text-[11px] font-bold ${
                filters.good_with_kids
                  ? 'border-violet-300 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              Kid friendly
            </button>
            <button
              onClick={() => updateFilters('good_with_pets', !filters.good_with_pets)}
              className={`rounded-full border px-3 py-1 text-[11px] font-bold ${
                filters.good_with_pets
                  ? 'border-violet-300 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              Good with pets
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {matchResults.map((result) => (
            <button
              key={result.animal.id}
              onClick={() => {
                setSelectedId(result.animal.id)
                setRequestedAnimalId(null)
              }}
              className="text-left"
            >
              <AnimalCard animal={result.animal} compact score={result.score} />
            </button>
          ))}
        </div>

        {matchResults.length === 0 ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-sm font-bold">No matches for those filters</p>
            <p className="mt-1 text-xs text-slate-500">Relax one filter to see more adoptable animals.</p>
          </div>
        ) : null}
      </div>

      <aside>
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <h3 className="text-sm font-bold">Your profile</h3>

          <div className="mt-3">
            <p className="text-[11px] font-medium text-slate-500">Living space</p>
            <select
              value={profile.living_space}
              onChange={(event) => updateProfile('living_space', event.target.value as LivingSpace)}
              className="mt-1 w-full rounded border border-violet-200 bg-violet-50 px-2 py-1 text-xs text-violet-700"
            >
              <option value="apartment">Apartment</option>
              <option value="house_no_yard">House, no yard</option>
              <option value="house_yard">House + yard</option>
            </select>
          </div>

          <div className="mt-3">
            <p className="text-[11px] font-medium text-slate-500">Lifestyle</p>
            <select
              value={profile.lifestyle}
              onChange={(event) => updateProfile('lifestyle', event.target.value as Lifestyle)}
              className="mt-1 w-full rounded border border-violet-200 bg-violet-50 px-2 py-1 text-xs text-violet-700"
            >
              <option value="sedentary">Sedentary</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
            </select>
          </div>

          <div className="mt-3">
            <p className="text-[11px] font-medium text-slate-500">Experience</p>
            <select
              value={profile.experience}
              onChange={(event) => updateProfile('experience', event.target.value as Experience)}
              className="mt-1 w-full rounded border border-violet-200 bg-violet-50 px-2 py-1 text-xs text-violet-700"
            >
              <option value="none">First pet</option>
              <option value="some">Some experience</option>
              <option value="experienced">Experienced</option>
            </select>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => updateProfile('has_children', !profile.has_children)}
              className={`flex-1 rounded border px-2 py-1 text-xs font-bold ${
                profile.has_children
                  ? 'border-violet-200 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              Kids
            </button>
            <button
              onClick={() => updateProfile('has_other_pets', !profile.has_other_pets)}
              className={`flex-1 rounded border px-2 py-1 text-xs font-bold ${
                profile.has_other_pets
                  ? 'border-violet-200 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              Pets
            </button>
          </div>
        </section>

        {selectedMatch ? (
          <section className="mt-3 rounded-lg border border-violet-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold">{selectedMatch.animal.name}</h3>
              <StatusBadge label={`${selectedMatch.score}%`} tone="purple" />
            </div>

            <div className="mt-3 grid h-20 place-items-center rounded bg-violet-50 text-2xl">
              {selectedMatch.animal.species}
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {selectedMatch.animal.breed} - {selectedMatch.animal.age_years}y - {selectedMatch.animal.size}
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-600">{selectedMatch.animal.description}</p>

            <ul className="mt-3 text-[11px] leading-5 text-violet-900">
              {selectedMatch.reasons.map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>

            {requestedAnimalId === selectedMatch.animal.id ? (
              <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-2 text-xs font-bold text-emerald-700">
                Request submitted. The shelter will contact you soon.
              </div>
            ) : (
              <button
                onClick={() => setRequestedAnimalId(selectedMatch.animal.id)}
                className="mt-3 w-full rounded bg-violet-600 px-3 py-2 text-xs font-bold text-white"
              >
                Request adoption
              </button>
            )}
          </section>
        ) : null}
      </aside>
    </div>
  )
}
