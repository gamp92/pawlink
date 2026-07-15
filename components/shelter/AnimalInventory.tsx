'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimalCard } from '@/components/shared/AnimalCard'
import { ActionBar } from '@/components/shared/ActionBar'
import { Badge } from '@/components/shared/Badge'
import { BottomSheet } from '@/components/shared/BottomSheet'
import { Button } from '@/components/shared/Button'
import { DashboardCard } from '@/components/shared/DashboardCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { FilterBar } from '@/components/shared/FilterBar'
import { LoadingState } from '@/components/shared/LoadingState'
import { SearchBar } from '@/components/shared/SearchBar'
import { SectionTitle } from '@/components/shared/SectionTitle'
import { StatusBadge, animalStatusTone } from '@/components/shared/StatusBadge'
import { ShelterHubLayout } from '@/components/shelter/ShelterHubLayout'
import { useShelterWorkspace } from '@/components/shelter/ShelterWorkspaceContext'
import { useShelterAnimals } from '@/components/shelter/hooks/useShelterAnimals'
import type { Animal, AnimalStatus, Species } from '@/lib/mock-data'

type StatusFilter = 'all' | AnimalStatus
type AnimalFormMode = 'create' | 'edit'
type AnimalFormState = {
  name: string
  species: Species | ''
  age_years: string
  size: Animal['size']
  status: AnimalStatus
  description: string
}

const statuses: AnimalStatus[] = ['available', 'in_process', 'adopted']
const speciesOptions: Species[] = ['dog', 'cat', 'other']
const sizeOptions: Animal['size'][] = ['small', 'medium', 'large']
const filterOptions: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'In process', value: 'in_process' },
  { label: 'Adopted', value: 'adopted' },
]

const emptyForm: AnimalFormState = {
  name: '',
  species: '',
  age_years: '1',
  size: 'medium',
  status: 'available',
  description: '',
}

const fieldClassName =
  'mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50 disabled:text-slate-400'

function getFormFromAnimal(animal: Animal): AnimalFormState {
  return {
    name: animal.name,
    species: animal.species,
    age_years: String(animal.age_years),
    size: animal.size,
    status: animal.status,
    description: animal.description,
  }
}

export function AnimalInventory() {
  const { shelterId, shelterName } = useShelterWorkspace()
  const shelter = useMemo(() => ({ id: shelterId, name: shelterName, city: 'CDMX' }), [shelterId, shelterName])
  const {
    data: animals,
    isLoading,
    error,
    mutationError,
    isFallback,
    isEmpty,
    pendingAnimalIds,
    isCreating,
    updateAnimalStatus,
    updateAnimalDetails,
    createAnimal,
  } = useShelterAnimals({ shelterId, shelter })
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedId, setSelectedId] = useState('')
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [formMode, setFormMode] = useState<AnimalFormMode | null>(null)
  const [formState, setFormState] = useState<AnimalFormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<'name' | 'species', string>>>({})
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const selectedAnimal = animals.find((animal) => animal.id === selectedId) ?? animals[0]

  useEffect(() => {
    if (!animals.length) {
      setSelectedId('')
      return
    }

    if (!selectedId || !animals.some((animal) => animal.id === selectedId)) {
      setSelectedId(animals[0].id)
    }
  }, [animals, selectedId])

  const visibleAnimals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return animals.filter((animal) => {
      const matchesQuery =
        !normalizedQuery ||
        animal.name.toLowerCase().includes(normalizedQuery) ||
        animal.breed.toLowerCase().includes(normalizedQuery) ||
        animal.species.toLowerCase().includes(normalizedQuery)
      const matchesStatus = statusFilter === 'all' || animal.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [animals, query, statusFilter])

  function selectAnimal(animal: Animal) {
    setSelectedId(animal.id)
    setFormMode(null)
    setFeedback(null)
    setIsDetailOpen(true)
  }

  async function updateStatus(status: AnimalStatus) {
    if (!selectedAnimal) return
    const didSave = await updateAnimalStatus(selectedAnimal.id, status)
    setFeedback(
      didSave
        ? { tone: 'success', message: 'Animal status updated.' }
        : { tone: 'error', message: 'Status update failed. Changes were rolled back.' },
    )
  }

  function openCreateForm() {
    setFormState(emptyForm)
    setFormErrors({})
    setFeedback(null)
    setFormMode('create')
    setIsDetailOpen(true)
  }

  function openEditForm(animal: Animal) {
    setSelectedId(animal.id)
    setFormState(getFormFromAnimal(animal))
    setFormErrors({})
    setFeedback(null)
    setFormMode('edit')
    setIsDetailOpen(true)
  }

  function updateFormField<Field extends keyof AnimalFormState>(field: Field, value: AnimalFormState[Field]) {
    setFormState((current) => ({ ...current, [field]: value }))
    if (field === 'name' || field === 'species') {
      setFormErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  function validateForm() {
    const nextErrors: Partial<Record<'name' | 'species', string>> = {}

    if (!formState.name.trim()) nextErrors.name = 'Name is required.'
    if (!formState.species) nextErrors.species = 'Species is required.'

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function submitAnimalForm() {
    if (!formMode || !validateForm()) return

    const species = formState.species
    if (!species) return

    const age = Number(formState.age_years)
    const normalizedAge = Number.isFinite(age) && age >= 0 ? age : 0
    const description = formState.description.trim() || 'No description provided yet.'

    if (formMode === 'create') {
      const createdAnimal = await createAnimal({
        name: formState.name.trim(),
        species,
        breed: 'Mixed',
        age_years: normalizedAge,
        size: formState.size,
        gender: 'female',
        color: 'unknown',
        description,
        energy_level: 'medium',
        good_with_kids: false,
        good_with_pets: false,
        photo_urls: [],
      })

      if (createdAnimal) {
        setSelectedId(createdAnimal.id)
        setFormMode(null)
        setFeedback({ tone: 'success', message: `${createdAnimal.name} was added to the inventory.` })
        return
      }

      setFeedback({ tone: 'error', message: 'Animal creation failed. The optimistic item was removed.' })
      return
    }

    if (!selectedAnimal) return

    const didSave = await updateAnimalDetails(selectedAnimal.id, {
      name: formState.name.trim(),
      species,
      age_years: normalizedAge,
      size: formState.size,
      status: formState.status,
      description,
    })

    if (didSave) {
      setFormMode(null)
      setFeedback({ tone: 'success', message: `${formState.name.trim()} was updated.` })
    } else {
      setFeedback({ tone: 'error', message: 'Animal update failed. Changes were rolled back.' })
    }
  }

  const isSaving = isCreating || Boolean(selectedAnimal && pendingAnimalIds.has(selectedAnimal.id))
  const isFormOpen = formMode !== null
  const panelTitle = isFormOpen ? (formMode === 'create' ? 'Create animal' : 'Edit animal') : 'Animal details'

  return (
    <ShelterHubLayout
      active="Animals"
      title="Animal inventory"
      subtitle="Search, review, and update adoption readiness with a mobile-first inventory flow."
      action={<Button size="sm" onClick={openCreateForm} disabled={isCreating}>New animal</Button>}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <section>
          <DashboardCard className="sticky top-0 z-30 bg-white/90 backdrop-blur">
            <SectionTitle
              title="Browse animals"
              description="Use filters to quickly find pets that need an update."
              action={<StatusBadge label={`${visibleAnimals.length} shown`} tone="purple" />}
            />
            <div className="mt-4 space-y-3">
              <SearchBar value={query} onChange={setQuery} placeholder="Search name, breed, or species" />
              <FilterBar options={filterOptions} value={statusFilter} onChange={setStatusFilter} />
            </div>
          </DashboardCard>

          {isLoading ? (
            <div className="mt-4">
              <LoadingState label="Loading shelter animals" />
            </div>
          ) : null}
          {error ? (
            <div className="mt-4">
              <ErrorState
                title={isFallback ? 'Using fallback animals' : 'Animal data issue'}
                description={error}
              />
            </div>
          ) : null}
          {mutationError ? (
            <div className="mt-4">
              <ErrorState title="Update rolled back" description={mutationError} />
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {visibleAnimals.map((animal) => (
              <div key={animal.id}>
                <AnimalCard
                  animal={animal}
                  compact
                  selected={selectedAnimal?.id === animal.id}
                  onSelect={() => selectAnimal(animal)}
                />
                <div className="-mt-2 flex justify-end px-3 pb-3">
                  <button
                    onClick={() => openEditForm(animal)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-violet-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {visibleAnimals.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title={isEmpty ? 'No animals yet' : 'No animals match those filters'}
                description={
                  isEmpty
                    ? 'Create an animal profile to start managing this shelter inventory.'
                    : 'Try clearing the search or switching status filters.'
                }
                action={
                  isEmpty ? (
                    <Button onClick={openCreateForm} disabled={isCreating}>New animal</Button>
                  ) : (
                    <Button variant="secondary" onClick={() => { setQuery(''); setStatusFilter('all') }}>Clear filters</Button>
                  )
                }
              />
            </div>
          ) : null}
        </section>

        <BottomSheet
          open={(Boolean(selectedAnimal) || isFormOpen) && isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={panelTitle}
          className="lg:sticky lg:top-4 lg:self-start"
        >
          {feedback ? (
            <div
              className={`mb-4 rounded-2xl border px-4 py-3 text-sm font-bold ${
                feedback.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          {isFormOpen ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                submitAnimalForm()
              }}
            >
              <div>
                <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="animal-name">
                  Name
                </label>
                <input
                  id="animal-name"
                  value={formState.name}
                  onChange={(event) => updateFormField('name', event.target.value)}
                  className={fieldClassName}
                  placeholder="Luna"
                  disabled={isSaving}
                />
                {formErrors.name ? <p className="mt-1 text-xs font-bold text-rose-600">{formErrors.name}</p> : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="animal-species">
                    Species
                  </label>
                  <select
                    id="animal-species"
                    value={formState.species}
                    onChange={(event) => updateFormField('species', event.target.value as Species | '')}
                    className={fieldClassName}
                    disabled={isSaving}
                  >
                    <option value="">Choose species</option>
                    {speciesOptions.map((species) => (
                      <option key={species} value={species}>
                        {species}
                      </option>
                    ))}
                  </select>
                  {formErrors.species ? (
                    <p className="mt-1 text-xs font-bold text-rose-600">{formErrors.species}</p>
                  ) : null}
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="animal-age">
                    Age
                  </label>
                  <input
                    id="animal-age"
                    type="number"
                    min="0"
                    value={formState.age_years}
                    onChange={(event) => updateFormField('age_years', event.target.value)}
                    className={fieldClassName}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="animal-size">
                    Size
                  </label>
                  <select
                    id="animal-size"
                    value={formState.size}
                    onChange={(event) => updateFormField('size', event.target.value as Animal['size'])}
                    className={fieldClassName}
                    disabled={isSaving}
                  >
                    {sizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="animal-status">
                    Status
                  </label>
                  <select
                    id="animal-status"
                    value={formState.status}
                    onChange={(event) => updateFormField('status', event.target.value as AnimalStatus)}
                    className={fieldClassName}
                    disabled={isSaving}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="animal-description">
                  Description
                </label>
                <textarea
                  id="animal-description"
                  value={formState.description}
                  onChange={(event) => updateFormField('description', event.target.value)}
                  className={`${fieldClassName} min-h-28 resize-none leading-6`}
                  placeholder="Temperament, medical notes, or adoption readiness..."
                  disabled={isSaving}
                />
              </div>

              <ActionBar className="rounded-2xl">
                <Button type="submit" fullWidth disabled={isSaving}>
                  {isSaving ? 'Saving...' : formMode === 'create' ? 'Create animal' : 'Save changes'}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setFormMode(null)
                    setFormErrors({})
                  }}
                  variant="secondary"
                  fullWidth
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </ActionBar>
            </form>
          ) : selectedAnimal ? (
            <>
              <div className="grid h-40 place-items-center rounded-2xl bg-gradient-to-br from-violet-50 to-teal-50 text-5xl font-black text-violet-700">
                {selectedAnimal.name.slice(0, 1)}
              </div>

              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-2xl font-black tracking-tight text-slate-950">{selectedAnimal.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {selectedAnimal.breed} - {selectedAnimal.age_years}y - {selectedAnimal.size}
                  </p>
                </div>
                <StatusBadge label={selectedAnimal.status.replace('_', ' ')} tone={animalStatusTone(selectedAnimal.status)} />
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">{selectedAnimal.description}</p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Badge tone="teal">{selectedAnimal.species}</Badge>
                <Badge tone="slate">{selectedAnimal.energy_level} energy</Badge>
                <Badge tone={selectedAnimal.good_with_kids ? 'green' : 'slate'}>
                  {selectedAnimal.good_with_kids ? 'Kids ok' : 'Kids review'}
                </Badge>
                <Badge tone={selectedAnimal.good_with_pets ? 'green' : 'slate'}>
                  {selectedAnimal.good_with_pets ? 'Pets ok' : 'Solo pet'}
                </Badge>
              </div>

              <div className="mt-4 grid gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    disabled={pendingAnimalIds.has(selectedAnimal.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                      selectedAnimal.status === status
                        ? 'border-violet-600 bg-violet-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    Mark {status.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <ActionBar className="mt-4 rounded-2xl">
                <Button onClick={() => openEditForm(selectedAnimal)} fullWidth disabled={pendingAnimalIds.has(selectedAnimal.id)}>
                  Edit animal
                </Button>
              </ActionBar>
            </>
          ) : null}
        </BottomSheet>
      </div>
    </ShelterHubLayout>
  )
}
