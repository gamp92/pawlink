'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { getAnimalDisplayImage } from '@/components/shared/pet-display-image'
import { AdoptionApplicationFlow } from '@/components/public/adoption/AdoptionApplicationFlow'
import { animals as mockAnimals, type Animal, type Species } from '@/lib/mock-data'

type LivingSpace = 'apartment' | 'house_no_yard' | 'house_yard'
type Lifestyle = 'sedentary' | 'moderate' | 'active'
type Experience = 'none' | 'some' | 'experienced'
type SizeFilter = 'all' | Animal['size']
type EnergyFilter = 'all' | Animal['energy_level']
type SpeciesFilter = 'all' | Species
type ProfileSection = 'home' | 'time' | 'experience' | 'activity' | 'children' | 'pets' | 'preferences'
type SortOption = 'best_match' | 'newest' | 'age'

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

const petsPerPage = 4

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

function profileSummary(profile: FamilyProfile) {
  const livingSpaceLabels: Record<LivingSpace, string> = {
    apartment: 'Apartment',
    house_no_yard: 'House',
    house_yard: 'House + yard',
  }
  const lifestyleLabels: Record<Lifestyle, string> = {
    sedentary: 'Quiet activity',
    moderate: 'Moderate activity',
    active: 'Active routine',
  }
  const experienceLabels: Record<Experience, string> = {
    none: 'First pet',
    some: 'Some experience',
    experienced: 'Experienced',
  }

  return `${livingSpaceLabels[profile.living_space]} · ${lifestyleLabels[profile.lifestyle]} · ${experienceLabels[profile.experience]}`
}

function activeFilterCount(filters: Filters) {
  return [
    filters.species !== 'all',
    filters.size !== 'all',
    filters.energy_level !== 'all',
    filters.good_with_kids,
    filters.good_with_pets,
  ].filter(Boolean).length
}

export function SmartAdoption() {
  const [availableAnimals, setAvailableAnimals] = useState<Animal[]>(fallbackAvailableAnimals)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const [profile, setProfile] = useState<FamilyProfile>(initialProfile)
  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('best_match')
  const [selectedId, setSelectedId] = useState(fallbackAvailableAnimals[0]?.id ?? '')
  const [isApplicationOpen, setIsApplicationOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false)
  const [openSection, setOpenSection] = useState<ProfileSection>('home')
  const [currentPage, setCurrentPage] = useState(1)

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
    () => {
      const results = availableAnimals
        .map((animal) => scoreAnimal(animal, profile))
        .filter((result) => matchesFilters(result, filters, query))

      return [...results].sort((a, b) => {
        if (sortBy === 'newest') {
          return Date.parse(b.animal.created_at || '1970-01-01') - Date.parse(a.animal.created_at || '1970-01-01')
        }
        if (sortBy === 'age') {
          return a.animal.age_years - b.animal.age_years
        }
        return b.score - a.score
      })
    },
    [availableAnimals, filters, profile, query, sortBy],
  )

  useEffect(() => {
    if (!matchResults.some((result) => result.animal.id === selectedId)) {
      setSelectedId(matchResults[0]?.animal.id ?? '')
    }
  }, [matchResults, selectedId])

  const totalPages = Math.max(1, Math.ceil(matchResults.length / petsPerPage))
  const currentPageResults = matchResults.slice((currentPage - 1) * petsPerPage, currentPage * petsPerPage)
  const selectedMatch = matchResults.find((result) => result.animal.id === selectedId) ?? matchResults[0]

  useEffect(() => {
    setCurrentPage(1)
  }, [filters, query, sortBy])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

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

  function selectMatch(id: string) {
    setSelectedId(id)
    setIsMobileDetailOpen(true)
  }

  function clearFilters() {
    setFilters(initialFilters)
  }

  function goToResultsPage(page: number) {
    const nextPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(nextPage)
    const firstResult = matchResults[(nextPage - 1) * petsPerPage]
    if (firstResult) {
      setSelectedId(firstResult.animal.id)
      setIsMobileDetailOpen(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl pb-28 lg:pb-0">
      <header className="pawlink-adoption-hero mb-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold text-violet-700">Smart Adoption</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Find a pet that fits your life</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-500">
              Browse available pets, tune your match profile, and compare compatibility before starting an application.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isLoading ? <StatusBadge label="Loading" tone="amber" /> : null}
            {isUsingFallback ? <StatusBadge label="Fallback data" tone="amber" /> : null}
          </div>
        </div>
      </header>

      <section className="pawlink-adoption-search-panel sticky top-0 z-20 -mx-4 px-4 py-4 backdrop-blur md:static md:mx-0">
        <PetSearchBar value={query} onChange={setQuery} />
        <PetFilterChips
          filters={filters}
          activeCount={activeFilterCount(filters)}
          onApply={applyFilter}
          onClear={clearFilters}
          onMoreFilters={() => setIsProfileOpen(true)}
        />
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_390px]">
        <main className="min-w-0 space-y-7">
          <MatchProfileCard
            profile={profile}
            filters={filters}
            open={isProfileOpen}
            activeSection={openSection}
            onToggle={() => setIsProfileOpen((current) => !current)}
            onSectionChange={setOpenSection}
            onProfileChange={updateProfile}
            onFiltersChange={setFilters}
          />

          <PetResultsToolbar
            count={matchResults.length}
            currentPage={currentPage}
            totalPages={totalPages}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {error ? <ErrorState title="Using fallback pets" description={error} /> : null}

          {isLoading ? <LoadingState label="Finding available pets" /> : null}

          {!isLoading && matchResults.length === 0 ? (
            <EmptyState
              title="No matches found"
              description="Try clearing your search or relaxing one filter to see more adoptable animals."
              action={activeFilterCount(filters) > 0 ? <Button onClick={clearFilters}>Clear filters</Button> : undefined}
            />
          ) : null}

          <div className="pawlink-adoption-results-grid">
            {currentPageResults.map((result) => (
              <AdoptionPetCard
                key={result.animal.id}
                animal={result.animal}
                score={result.score}
                selected={selectedId === result.animal.id}
                onSelect={() => selectMatch(result.animal.id)}
              />
            ))}
          </div>

          {matchResults.length > petsPerPage ? (
            <ResultsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToResultsPage}
            />
          ) : null}
        </main>

        <aside className="hidden lg:block">
          <DetailPanel match={selectedMatch} onRequest={requestSelectedAnimal} />
        </aside>
      </div>

      {selectedMatch ? (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4 lg:hidden">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-50 text-sm font-black text-violet-700">
                {selectedMatch.score}%
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-950">{selectedMatch.animal.name}</p>
                <p className="truncate text-xs text-slate-500">{selectedMatch.animal.shelter.name}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setIsMobileDetailOpen(true)}>
                View
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedMatch && isMobileDetailOpen ? (
        <MobileDetailSheet
          match={selectedMatch}
          onClose={() => setIsMobileDetailOpen(false)}
          onRequest={requestSelectedAnimal}
        />
      ) : null}

      <AdoptionApplicationFlow
        match={selectedMatch ?? null}
        open={isApplicationOpen}
        onClose={() => setIsApplicationOpen(false)}
      />
    </div>
  )
}

function PetSearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="sr-only">Search pets</span>
      <div className="pawlink-adoption-search">
        <span className="pawlink-adoption-search-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search pets by name, breed, species, or shelter"
          className="pawlink-adoption-search-input"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="pawlink-adoption-search-clear"
            aria-label="Clear search"
          >
            x
          </button>
        ) : null}
      </div>
    </label>
  )
}

function PetFilterChips({
  filters,
  activeCount,
  onApply,
  onClear,
  onMoreFilters,
}: {
  filters: Filters
  activeCount: number
  onApply: (update: (current: Filters) => Filters) => void
  onClear: () => void
  onMoreFilters: () => void
}) {
  return (
    <div className="mt-4">
      <div className="pawlink-adoption-filter-scroll">
        <div className="pawlink-adoption-filter-row">
          {filterChips.map((chip) => {
            const isActive = chip.isActive(filters)
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => onApply(chip.apply)}
                aria-pressed={isActive}
                className={`pawlink-adoption-chip ${isActive ? 'pawlink-adoption-chip-active' : ''}`}
              >
                {isActive ? <span aria-hidden="true">✓ </span> : null}
                {chip.label}
              </button>
            )
          })}
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={onClear}
              className="pawlink-adoption-chip pawlink-adoption-chip-clear"
            >
              Clear {activeCount}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onMoreFilters}
            className="pawlink-adoption-chip"
            aria-label="Open match profile filters"
          >
            More filters
          </button>
        </div>
      </div>
    </div>
  )
}

function MatchProfileCard({
  profile,
  filters,
  open,
  activeSection,
  onToggle,
  onSectionChange,
  onProfileChange,
  onFiltersChange,
}: {
  profile: FamilyProfile
  filters: Filters
  open: boolean
  activeSection: ProfileSection
  onToggle: () => void
  onSectionChange: (section: ProfileSection) => void
  onProfileChange: <Key extends keyof FamilyProfile>(key: Key, value: FamilyProfile[Key]) => void
  onFiltersChange: (filters: Filters) => void
}) {
  const currentStepIndex = matchProfileSteps.findIndex((step) => step.id === activeSection)
  const progress = ((currentStepIndex + 1) / matchProfileSteps.length) * 100
  const currentStep = matchProfileSteps[currentStepIndex] ?? matchProfileSteps[0]

  function goToNextStep() {
    const nextStep = matchProfileSteps[Math.min(currentStepIndex + 1, matchProfileSteps.length - 1)]
    onSectionChange(nextStep.id)
  }

  function goToPreviousStep() {
    const previousStep = matchProfileSteps[Math.max(currentStepIndex - 1, 0)]
    onSectionChange(previousStep.id)
  }

  return (
    <Card className="pawlink-match-profile-card">
      <div className="pawlink-match-profile-hero">
        <div className="pawlink-match-profile-orb" aria-hidden="true">AI</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-violet-700">Your Match Profile</p>
          <h3 className="mt-1 text-2xl font-black leading-none text-slate-950">Let Pawlink learn your home</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{matchProfileInsight(profile, filters)}</p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={onToggle} aria-expanded={open}>
          {open ? 'Done' : 'Tune match'}
        </Button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black text-slate-500">Profile strength</p>
            <p className="text-xs font-black text-violet-700">{Math.round(progress)}%</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="pawlink-match-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="pawlink-match-summary-chip">{profileSummary(profile)}</div>
      </div>

      {open ? (
        <div className="pawlink-match-onboarding">
          <div className="pawlink-match-stepper" aria-label="Match profile questions">
            {matchProfileSteps.map((step, index) => {
              const isActive = step.id === activeSection
              const isComplete = index < currentStepIndex
              return (
              <button
                key={step.id}
                type="button"
                onClick={() => onSectionChange(step.id)}
                aria-current={isActive ? 'step' : undefined}
                data-active={isActive}
                data-complete={isComplete}
              >
                <span>{isComplete ? 'OK' : index + 1}</span>
                <strong>{step.shortLabel}</strong>
              </button>
              )
            })}
          </div>

          <div className="pawlink-match-question" key={activeSection}>
            <div className="pawlink-match-question-copy">
              <p>Step {currentStepIndex + 1} of {matchProfileSteps.length}</p>
              <h4>{currentStep.title}</h4>
              <span>{currentStep.description}</span>
            </div>

            <MatchProfileStepContent
              step={activeSection}
              profile={profile}
              filters={filters}
              onProfileChange={onProfileChange}
              onFiltersChange={onFiltersChange}
            />
          </div>

          <div className="pawlink-match-live-summary">
            <div>
              <p className="text-xs font-black text-violet-700">Live summary</p>
              <h4>{matchProfileInsight(profile, filters)}</h4>
              <span>Your pet cards update instantly as Pawlink learns from each answer.</span>
            </div>
          </div>

          <div className="pawlink-match-actions">
            <Button type="button" variant="secondary" onClick={goToPreviousStep} disabled={currentStepIndex === 0}>
              Back
            </Button>
            {currentStepIndex === matchProfileSteps.length - 1 ? (
              <Button type="button" onClick={onToggle}>See matches</Button>
            ) : (
              <Button type="button" onClick={goToNextStep}>Next question</Button>
            )}
          </div>
        </div>
      ) : null}
    </Card>
  )
}

const matchProfileSteps: Array<{
  id: ProfileSection
  shortLabel: string
  title: string
  description: string
}> = [
  { id: 'home', shortLabel: 'Home', title: 'Where do you live?', description: 'This helps Pawlink understand space, noise, and daily comfort.' },
  { id: 'time', shortLabel: 'Time', title: 'How much time do you spend at home?', description: 'We will tune matches toward pets that fit your daily rhythm.' },
  { id: 'experience', shortLabel: 'Care', title: 'What is your pet experience?', description: 'Some pets are easier first companions, others need confident handling.' },
  { id: 'activity', shortLabel: 'Energy', title: 'What is your activity level?', description: 'A great match should enjoy the pace you naturally live.' },
  { id: 'children', shortLabel: 'Kids', title: 'Are there children at home?', description: 'Pawlink can prioritize pets known to be comfortable with children.' },
  { id: 'pets', shortLabel: 'Pets', title: 'Do you have other pets?', description: 'This helps avoid stressful introductions and supports smoother transitions.' },
  { id: 'preferences', shortLabel: 'Prefs', title: 'What kind of pet are you imagining?', description: 'Optional preferences narrow discovery without changing the matching logic.' },
]

function MatchProfileStepContent({
  step,
  profile,
  filters,
  onProfileChange,
  onFiltersChange,
}: {
  step: ProfileSection
  profile: FamilyProfile
  filters: Filters
  onProfileChange: <Key extends keyof FamilyProfile>(key: Key, value: FamilyProfile[Key]) => void
  onFiltersChange: (filters: Filters) => void
}) {
  if (step === 'home') {
    return (
      <OnboardingOptions
        value={profile.living_space}
        options={[
          { value: 'apartment', icon: 'APT', title: 'Apartment', description: 'Cozy space, close neighbors, calmer routines.' },
          { value: 'house_no_yard', icon: 'HOME', title: 'House', description: 'More room inside, flexible daily movement.' },
          { value: 'house_yard', icon: 'YARD', title: 'House with yard', description: 'Outdoor space for play and enrichment.' },
        ]}
        onSelect={(value) => onProfileChange('living_space', value as LivingSpace)}
      />
    )
  }

  if (step === 'time') {
    return (
      <OnboardingOptions
        value={profile.lifestyle}
        options={[
          { value: 'sedentary', icon: 'HOME', title: 'I am home often', description: 'A calm companion can settle into your rhythm.' },
          { value: 'moderate', icon: 'MID', title: 'A balanced routine', description: 'Some home time, some outings, steady care.' },
          { value: 'active', icon: 'MOVE', title: 'I am out and moving', description: 'Best for pets that enjoy active days.' },
        ]}
        onSelect={(value) => onProfileChange('lifestyle', value as Lifestyle)}
      />
    )
  }

  if (step === 'experience') {
    return (
      <OnboardingOptions
        value={profile.experience}
        options={[
          { value: 'none', icon: 'NEW', title: 'Never had a pet', description: 'Show me beginner-friendly companions.' },
          { value: 'some', icon: 'CARE', title: 'I have had some', description: 'I know the basics and can keep learning.' },
          { value: 'experienced', icon: 'PRO', title: 'Lots of experience', description: 'I can support pets with more needs.' },
        ]}
        onSelect={(value) => onProfileChange('experience', value as Experience)}
      />
    )
  }

  if (step === 'activity') {
    return (
      <OnboardingOptions
        value={profile.lifestyle}
        options={[
          { value: 'sedentary', icon: 'LOW', title: 'Low activity', description: 'Short walks, quiet nights, gentle play.' },
          { value: 'moderate', icon: 'MOD', title: 'Moderate activity', description: 'Daily walks and regular weekend time.' },
          { value: 'active', icon: 'HI', title: 'Very active', description: 'Runs, hikes, training, or long walks.' },
        ]}
        onSelect={(value) => onProfileChange('lifestyle', value as Lifestyle)}
      />
    )
  }

  if (step === 'children') {
    return (
      <OnboardingOptions
        value={profile.has_children ? 'yes' : 'no'}
        options={[
          { value: 'yes', icon: 'KID', title: 'Yes, children at home', description: 'Prioritize pets known to be kid-friendly.' },
          { value: 'no', icon: 'ADLT', title: 'No children at home', description: 'Keep matches open to adult households.' },
        ]}
        columns="sm:grid-cols-2"
        onSelect={(value) => onProfileChange('has_children', value === 'yes')}
      />
    )
  }

  if (step === 'pets') {
    return (
      <OnboardingOptions
        value={profile.has_other_pets ? 'yes' : 'no'}
        options={[
          { value: 'yes', icon: 'PET', title: 'Yes, other pets', description: 'Prioritize animals comfortable with pets.' },
          { value: 'no', icon: 'SOLO', title: 'No other pets', description: 'Solo companions are welcome too.' },
        ]}
        columns="sm:grid-cols-2"
        onSelect={(value) => onProfileChange('has_other_pets', value === 'yes')}
      />
    )
  }

  return (
    <div className="grid gap-4">
      <OnboardingOptions
        value={filters.species}
        options={[
          { value: 'all', icon: 'ALL', title: 'Any pet', description: 'Keep both cats and dogs visible.' },
          { value: 'dog', icon: 'DOG', title: 'Dogs', description: 'Show me dogs first.' },
          { value: 'cat', icon: 'CAT', title: 'Cats', description: 'Show me cats first.' },
        ]}
        onSelect={(value) => onFiltersChange({ ...filters, species: value as SpeciesFilter })}
      />
      <OnboardingOptions
        value={filters.size}
        options={[
          { value: 'all', icon: 'ALL', title: 'Any size', description: 'I am flexible on size.' },
          { value: 'small', icon: 'S', title: 'Small', description: 'Compact companions.' },
          { value: 'medium', icon: 'M', title: 'Medium', description: 'Balanced size.' },
          { value: 'large', icon: 'L', title: 'Large', description: 'Bigger companions.' },
        ]}
        columns="sm:grid-cols-4"
        onSelect={(value) => onFiltersChange({ ...filters, size: value as SizeFilter })}
      />
      <OnboardingOptions
        value={filters.energy_level}
        options={[
          { value: 'all', icon: 'ALL', title: 'Any energy', description: 'Keep options open.' },
          { value: 'low', icon: 'LOW', title: 'Calm', description: 'Quiet and gentle.' },
          { value: 'medium', icon: 'MID', title: 'Balanced', description: 'Some play, some rest.' },
          { value: 'high', icon: 'HIGH', title: 'Active', description: 'Ready to move.' },
        ]}
        columns="sm:grid-cols-4"
        onSelect={(value) => onFiltersChange({ ...filters, energy_level: value as EnergyFilter })}
      />
    </div>
  )
}

function OnboardingOptions<OptionValue extends string>({
  options,
  value,
  onSelect,
  columns = 'sm:grid-cols-3',
}: {
  options: Array<{ value: OptionValue; icon: string; title: string; description: string }>
  value: OptionValue | string
  onSelect: (value: OptionValue) => void
  columns?: string
}) {
  return (
    <div className={`pawlink-onboarding-options ${columns}`}>
      {options.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            aria-pressed={selected}
            className="pawlink-onboarding-card"
            data-selected={selected}
          >
            <span className="pawlink-onboarding-icon" aria-hidden="true">{option.icon}</span>
            <span>
              <span className="pawlink-onboarding-title">{option.title}</span>
              <span className="pawlink-onboarding-description">{option.description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function matchProfileInsight(profile: FamilyProfile, filters: Filters) {
  const energy = filters.energy_level === 'all'
    ? profile.lifestyle === 'sedentary'
      ? 'calm'
      : profile.lifestyle === 'active'
        ? 'active'
        : 'balanced'
    : filters.energy_level === 'low'
      ? 'calm'
      : filters.energy_level === 'high'
        ? 'active'
        : 'balanced'

  const size = filters.size === 'all'
    ? profile.living_space === 'apartment'
      ? 'small or medium-sized'
      : 'well-matched'
    : `${filters.size}-sized`

  const species = filters.species === 'dog'
    ? 'dogs'
    : filters.species === 'cat'
      ? 'cats'
      : 'pets'

  const home = profile.living_space === 'apartment'
    ? 'living in apartments'
    : profile.living_space === 'house_yard'
      ? 'with room to enjoy a yard'
      : 'living in homes'

  return `You seem to be a great match for ${energy} ${size} ${species} ${home}.`
}

function PetResultsToolbar({
  count,
  currentPage,
  totalPages,
  sortBy,
  onSortChange,
}: {
  count: number
  currentPage: number
  totalPages: number
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-base font-black text-slate-950">{count} pets matched to your profile</h3>
        <p className="mt-1 text-sm text-slate-500">
          Showing page {currentPage} of {totalPages}. Sorted by compatibility unless you choose another view.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
        <span>Sort</span>
        <select
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value as SortOption)}
          className="public-select"
        >
          <option value="best_match">Best match</option>
          <option value="newest">Newest</option>
          <option value="age">Age</option>
        </select>
      </label>
    </div>
  )
}

function ResultsPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  return (
    <nav className="pawlink-adoption-pagination" aria-label="Pet results pages">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>
      <div className="pawlink-adoption-page-dots">
        {Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
              data-active={currentPage === page}
            >
              {page}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </nav>
  )
}

function animalTraits(animal: Animal) {
  return [
    animal.energy_level ? `${animal.energy_level[0].toUpperCase()}${animal.energy_level.slice(1)} energy` : null,
    animal.good_with_kids ? 'Kid friendly' : null,
    animal.good_with_pets ? 'Pet friendly' : 'Solo home',
  ].filter(Boolean).slice(0, 3)
}

function AdoptionPetCard({
  animal,
  score,
  selected,
  onSelect,
}: {
  animal: Animal
  score: number
  selected: boolean
  onSelect: () => void
}) {
  const imageUrl = getAnimalDisplayImage(animal)

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.currentTarget !== event.target) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  function handleFavoriteClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`View profile for ${animal.name}`}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className="pawlink-adoption-card"
      data-selected={selected ? 'true' : undefined}
    >
      <div className="pawlink-adoption-card-image">
        <img src={imageUrl} alt={`${animal.name}, ${animal.breed} available for adoption`} className="pawlink-pet-photo" />
        <div className="pawlink-adoption-card-species">{animal.species}</div>
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="pawlink-adoption-favorite"
          aria-label={`Save ${animal.name}`}
          aria-pressed="false"
        >
          ♡
        </button>
        <div className="pawlink-adoption-match-badge">{score}% match</div>
      </div>

      <div className="pawlink-adoption-card-body">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-black tracking-tight text-slate-950">{animal.name}</h3>
            <p className="mt-1 truncate text-sm font-semibold text-slate-500">{animal.breed}</p>
          </div>
          <span className="pawlink-adoption-status">{animal.status.replace('_', ' ')}</span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-black text-violet-700">View profile</span>
          <span className="text-xs font-bold text-slate-400">{animal.age_years} yrs · {animal.size}</span>
        </div>
      </div>
    </article>
  )
}

function DetailPanel({ match, onRequest }: { match?: MatchResult; onRequest: () => void }) {
  if (!match) {
    return (
      <EmptyState
        title="Select a pet"
        description="Choose a match to see adoption details, reasons, and next steps."
      />
    )
  }
  const imageUrl = getAnimalDisplayImage(match.animal)

  return (
    <Card className="pawlink-selected-pet-panel">
      <div className="pawlink-photo-frame rounded-[1.35rem]" style={{ aspectRatio: '4 / 3' }}>
        <img src={imageUrl} alt={`${match.animal.name}, ${match.animal.breed} available for adoption`} className="pawlink-pet-photo" />
        <div className="pawlink-adoption-match-badge">
          {match.score}% match
        </div>
        <button
          type="button"
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/90 text-sm font-black text-violet-700 shadow-sm"
          aria-label={`Save ${match.animal.name}`}
        >
          ♡
        </button>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-3xl font-black tracking-tight text-slate-950">{match.animal.name}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{match.animal.shelter.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {match.animal.breed} · {match.animal.age_years} years · {match.animal.size}
          </p>
        </div>
        <StatusBadge label={match.animal.species} tone="teal" />
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{match.animal.description}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="font-black text-slate-950">{match.animal.age_years}</p>
          <p className="mt-1 text-slate-500">Years</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="font-black text-slate-950">{match.animal.size}</p>
          <p className="mt-1 text-slate-500">Size</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="font-black text-slate-950">{match.animal.energy_level}</p>
          <p className="mt-1 text-slate-500">Energy</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-slate-950">Compatibility</p>
          <span className="text-sm font-black text-violet-700">{match.score}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-teal-500" style={{ width: `${match.score}%` }} />
        </div>
        <p className="pt-2 text-sm font-black text-slate-950">Why this match works</p>
        {match.reasons.map((reason) => (
          <div key={reason} className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-sm font-bold text-violet-900">
            {reason}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {animalTraits(match.animal).map((trait) => (
          <span key={trait} className="pawlink-adoption-trait">{trait}</span>
        ))}
      </div>

      <div className="mt-5">
        <Button onClick={onRequest} fullWidth>
          Request Adoption
        </Button>
      </div>
    </Card>
  )
}

function MobileDetailSheet({
  match,
  onClose,
  onRequest,
}: {
  match: MatchResult
  onClose: () => void
  onRequest: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden" role="dialog" aria-modal="true" aria-label={`${match.animal.name} details`}>
      <button type="button" className="absolute inset-0 h-full w-full cursor-default" onClick={onClose} aria-label="Close pet details" />
      <div className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-white p-4 shadow-xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-violet-700">{match.score}% match</p>
              <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{match.animal.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{match.animal.shelter.name}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-sm font-black text-slate-500 shadow-sm focus:outline-none focus:ring-4 focus:ring-violet-100"
              aria-label="Close pet details"
            >
              x
            </button>
          </div>
          <div className="mt-4">
            <DetailPanel match={match} onRequest={onRequest} />
          </div>
        </div>
      </div>
    </div>
  )
}
