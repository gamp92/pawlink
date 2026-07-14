'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimalCard } from '@/components/shared/AnimalCard'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AdoptionApplicationFlow } from '@/components/public/adoption/AdoptionApplicationFlow'
import { animals as mockAnimals, type Animal, type Species } from '@/lib/mock-data'

type LivingSpace = 'apartment' | 'house_no_yard' | 'house_yard'
type Lifestyle = 'sedentary' | 'moderate' | 'active'
type Experience = 'none' | 'some' | 'experienced'
type SizeFilter = 'all' | Animal['size']
type EnergyFilter = 'all' | Animal['energy_level']
type SpeciesFilter = 'all' | Species
type ProfileSection = 'home' | 'routine' | 'experience'

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

type ApiAnimal = {
  id: string
  name: string
  species: Species
  breed: string | null
  age_years: number | null
  size: Animal['size'] | null
  gender: Animal['gender'] | null
  energy_level: Animal['energy_level'] | null
  good_with_kids: boolean | null
  good_with_pets: boolean | null
  photo_urls: string[] | null
  shelter: Animal['shelter'] | null
}

const fallbackAvailableAnimals = mockAnimals.filter((animal) => animal.status === 'available')

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

const filterChips: Array<{
  label: string
  isActive: (filters: Filters) => boolean
  apply: (filters: Filters) => Filters
}> = [
  {
    label: 'Dogs',
    isActive: (filters) => filters.species === 'dog',
    apply: (filters) => ({ ...filters, species: filters.species === 'dog' ? 'all' : 'dog' }),
  },
  {
    label: 'Cats',
    isActive: (filters) => filters.species === 'cat',
    apply: (filters) => ({ ...filters, species: filters.species === 'cat' ? 'all' : 'cat' }),
  },
  {
    label: 'Small',
    isActive: (filters) => filters.size === 'small',
    apply: (filters) => ({ ...filters, size: filters.size === 'small' ? 'all' : 'small' }),
  },
  {
    label: 'Low energy',
    isActive: (filters) => filters.energy_level === 'low',
    apply: (filters) => ({ ...filters, energy_level: filters.energy_level === 'low' ? 'all' : 'low' }),
  },
  {
    label: 'Kid friendly',
    isActive: (filters) => filters.good_with_kids,
    apply: (filters) => ({ ...filters, good_with_kids: !filters.good_with_kids }),
  },
  {
    label: 'Good with pets',
    isActive: (filters) => filters.good_with_pets,
    apply: (filters) => ({ ...filters, good_with_pets: !filters.good_with_pets }),
  },
]

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

function matchesFilters(result: MatchResult, filters: Filters, query: string) {
  const { animal } = result
  const normalizedQuery = query.trim().toLowerCase()
  if (filters.species !== 'all' && animal.species !== filters.species) return false
  if (filters.size !== 'all' && animal.size !== filters.size) return false
  if (filters.energy_level !== 'all' && animal.energy_level !== filters.energy_level) return false
  if (filters.good_with_kids && !animal.good_with_kids) return false
  if (filters.good_with_pets && !animal.good_with_pets) return false
  if (!normalizedQuery) return true
  return [animal.name, animal.breed, animal.species, animal.shelter.name]
    .join(' ')
    .toLowerCase()
    .includes(normalizedQuery)
}

function toAnimal(apiAnimal: ApiAnimal): Animal {
  return {
    id: apiAnimal.id,
    name: apiAnimal.name,
    species: apiAnimal.species,
    breed: apiAnimal.breed ?? 'Mixed',
    age_years: Number(apiAnimal.age_years ?? 0),
    size: apiAnimal.size ?? 'medium',
    gender: apiAnimal.gender ?? 'female',
    status: 'available',
    color: 'unknown',
    description: `${apiAnimal.name} is available for adoption through ${apiAnimal.shelter?.name ?? 'a partner shelter'}.`,
    energy_level: apiAnimal.energy_level ?? 'medium',
    good_with_kids: Boolean(apiAnimal.good_with_kids),
    good_with_pets: Boolean(apiAnimal.good_with_pets),
    photo_urls: apiAnimal.photo_urls ?? [],
    social_post: null,
    shelter: apiAnimal.shelter ?? { id: 'unknown-shelter', name: 'Partner shelter', city: 'CDMX' },
    created_at: '',
  }
}

function optionClass(isActive: boolean) {
  return `h-11 flex-1 rounded-xl border px-3 text-xs font-bold ${
    isActive ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-600'
  }`
}

export function SmartAdoption() {
  const [availableAnimals, setAvailableAnimals] = useState<Animal[]>(fallbackAvailableAnimals)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [profile, setProfile] = useState<FamilyProfile>(initialProfile)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(fallbackAvailableAnimals[0]?.id ?? '')
  const [isApplicationOpen, setIsApplicationOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(true)
  const [openSection, setOpenSection] = useState<ProfileSection>('home')

  useEffect(() => {
    let isMounted = true

    async function loadAnimals() {
      try {
        const response = await fetch('/api/animals/public', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Could not load available animals')
        }

        const payload = (await response.json()) as { animals?: ApiAnimal[] }
        const apiAnimals = payload.animals ?? []

        if (!isMounted) return

        if (apiAnimals.length === 0) {
          setAvailableAnimals(fallbackAvailableAnimals)
          setIsUsingFallback(true)
          setError('No public animals returned yet. Showing fallback animals.')
          return
        }

        const nextAnimals = apiAnimals.map(toAnimal)
        setAvailableAnimals(nextAnimals)
        setSelectedId(nextAnimals[0]?.id ?? '')
        setIsUsingFallback(false)
        setError(null)
      } catch {
        if (!isMounted) return
        setAvailableAnimals(fallbackAvailableAnimals)
        setSelectedId(fallbackAvailableAnimals[0]?.id ?? '')
        setIsUsingFallback(true)
        setError('Public animals API is unavailable. Showing fallback animals.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadAnimals()

    return () => {
      isMounted = false
    }
  }, [])

  const matchResults = useMemo(
    () =>
      availableAnimals
        .map((animal) => scoreAnimal(animal, profile))
        .filter((result) => matchesFilters(result, filters, query))
        .sort((a, b) => b.score - a.score),
    [availableAnimals, filters, profile, query],
  )

  useEffect(() => {
    if (!matchResults.some((result) => result.animal.id === selectedId)) {
      setSelectedId(matchResults[0]?.animal.id ?? '')
    }
  }, [matchResults, selectedId])

  const selectedMatch = matchResults.find((result) => result.animal.id === selectedId) ?? matchResults[0]

  function updateProfile<Key extends keyof FamilyProfile>(key: Key, value: FamilyProfile[Key]) {
    setProfile((current) => ({ ...current, [key]: value }))
  }

  function applyFilter(update: (current: Filters) => Filters) {
    setFilters((current) => update(current))
  }

  function requestSelectedAnimal() {
    if (!selectedMatch) return
    setIsApplicationOpen(true)
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="grid gap-5 md:grid-cols-2">
        <section className="min-w-0">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-950">Find your best match</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Search, tune your profile, and compare pets by compatibility.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {isLoading ? <StatusBadge label="Loading" tone="amber" /> : null}
                {isUsingFallback ? <StatusBadge label="Fallback" tone="amber" /> : null}
                <StatusBadge label={`${matchResults.length}`} tone="purple" />
              </div>
            </div>

            <label className="block">
              <span className="sr-only">Search pets</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, breed, species, or shelter"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 shadow-sm"
              />
            </label>

            <div className="overflow-x-auto">
              <div className="flex gap-2">
                {filterChips.map((chip) => {
                  const isActive = chip.isActive(filters)
                  return (
                    <button
                      key={chip.label}
                      onClick={() => applyFilter(chip.apply)}
                      className={`h-11 shrink-0 rounded-full border px-4 text-xs font-bold ${
                        isActive ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {chip.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <Card className="mt-4">
            <button
              onClick={() => setIsProfileOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <p className="text-sm font-black text-slate-950">Match profile</p>
                <p className="mt-1 text-xs text-slate-500">
                  {profile.living_space.replace('_', ' ')} - {profile.lifestyle} - {profile.experience}
                </p>
              </div>
              <StatusBadge label={isProfileOpen ? 'Hide' : 'Edit'} tone="purple" />
            </button>

            {isProfileOpen ? (
              <div className="mt-4 space-y-3">
                {[
                  ['home', 'Home setup'],
                  ['routine', 'Routine'],
                  ['experience', 'Experience'],
                ].map(([section, label]) => (
                  <button
                    key={section}
                    onClick={() => setOpenSection(section as ProfileSection)}
                    className={`h-11 rounded-xl border px-3 text-xs font-bold ${
                      openSection === section
                        ? 'border-violet-300 bg-violet-50 text-violet-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}

                {openSection === 'home' ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      ['apartment', 'Apartment'],
                      ['house_no_yard', 'House'],
                      ['house_yard', 'House + yard'],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => updateProfile('living_space', value as LivingSpace)}
                        className={optionClass(profile.living_space === value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : null}

                {openSection === 'routine' ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      ['sedentary', 'Quiet'],
                      ['moderate', 'Balanced'],
                      ['active', 'Active'],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => updateProfile('lifestyle', value as Lifestyle)}
                        className={optionClass(profile.lifestyle === value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : null}

                {openSection === 'experience' ? (
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[
                        ['none', 'First pet'],
                        ['some', 'Some care'],
                        ['experienced', 'Experienced'],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => updateProfile('experience', value as Experience)}
                          className={optionClass(profile.experience === value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateProfile('has_children', !profile.has_children)}
                        className={optionClass(profile.has_children)}
                      >
                        Kids at home
                      </button>
                      <button
                        onClick={() => updateProfile('has_other_pets', !profile.has_other_pets)}
                        className={optionClass(profile.has_other_pets)}
                      >
                        Other pets
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </Card>

          {error ? (
            <div className="mt-4">
              <ErrorState title="Using fallback pets" description={error} />
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-4">
              <LoadingState label="Finding available pets" />
            </div>
          ) : null}

          {!isLoading && matchResults.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No matches found"
                description="Try clearing your search or relaxing one filter to see more adoptable animals."
              />
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {matchResults.map((result) => (
              <button
                key={result.animal.id}
                onClick={() => {
                  setSelectedId(result.animal.id)
                }}
                className="text-left"
              >
                <AnimalCard animal={result.animal} compact score={result.score} selected={selectedId === result.animal.id} />
              </button>
            ))}
          </div>
        </section>

        <aside className="hidden md:block">
          <DetailPanel
            match={selectedMatch}
            onRequest={requestSelectedAnimal}
          />
        </aside>
      </div>

      {selectedMatch ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-4 shadow-lg md:hidden">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">{selectedMatch.animal.name}</p>
                <p className="text-xs text-slate-500">{selectedMatch.score}% match - {selectedMatch.animal.shelter.name}</p>
              </div>
              <StatusBadge label={selectedMatch.animal.species} tone="teal" />
            </div>
            <div className="mt-3">
              <Button onClick={requestSelectedAnimal} fullWidth>
                Request Adoption
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <AdoptionApplicationFlow
        match={selectedMatch ?? null}
        open={isApplicationOpen}
        onClose={() => setIsApplicationOpen(false)}
      />
    </div>
  )
}

function DetailPanel({
  match,
  onRequest,
}: {
  match?: MatchResult
  onRequest: () => void
}) {
  if (!match) {
    return (
      <EmptyState
        title="Select a pet"
        description="Choose a match to see adoption details, reasons, and next steps."
      />
    )
  }

  return (
    <Card className="border-violet-200">
      <div className="relative grid h-36 place-items-center rounded-2xl bg-gradient-to-br from-violet-50 to-teal-50">
        <div className="absolute left-3 top-0 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-violet-700">
          {match.score}% match
        </div>
        <div className="text-4xl font-black text-violet-700">{match.animal.name.slice(0, 1)}</div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-slate-950">{match.animal.name}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{match.animal.shelter.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {match.animal.breed} - {match.animal.age_years} years - {match.animal.size}
          </p>
        </div>
        <StatusBadge label={match.animal.species} tone="teal" />
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{match.animal.description}</p>

      <div className="mt-4 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Why this match works</p>
        {match.reasons.map((reason) => (
          <div key={reason} className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs font-bold text-violet-900">
            {reason}
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Button onClick={onRequest} fullWidth>
          Request Adoption
        </Button>
      </div>
    </Card>
  )
}
