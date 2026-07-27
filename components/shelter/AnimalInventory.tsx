'use client'

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
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
import { getAnimalDisplayImage } from '@/components/shared/pet-display-image'
import {
  AnimalFormPanel,
  emptyAnimalForm,
  getFormFromAnimal,
  statuses,
  type AnimalFormMode,
  type AnimalFormState,
  type SelectedAnimalPhoto,
} from '@/components/shelter/AnimalFormPanel'
import { ShelterHubLayout } from '@/components/shelter/ShelterHubLayout'
import { useShelterWorkspace } from '@/components/shelter/ShelterWorkspaceContext'
import { useShelterAnimals } from '@/components/shelter/hooks/useShelterAnimals'
import { uploadAnimalPhotos } from '@/components/shelter/animal-photo-adapter'
import type { Animal, AnimalStatus } from '@/lib/mock-data'

type StatusFilter = 'all' | AnimalStatus
const animalsPerPage = 8

const filterOptions: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'In process', value: 'in_process' },
  { label: 'Adopted', value: 'adopted' },
]

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
  const [currentPage, setCurrentPage] = useState(1)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [formMode, setFormMode] = useState<AnimalFormMode | null>(null)
  const [formState, setFormState] = useState<AnimalFormState>(emptyAnimalForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<'name' | 'species', string>>>({})
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [photos, setPhotos] = useState<SelectedAnimalPhoto[]>([])
  const [isSubmittingForm, setIsSubmittingForm] = useState(false)
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

  const totalPages = Math.max(1, Math.ceil(visibleAnimals.length / animalsPerPage))
  const pagedAnimals = visibleAnimals.slice((currentPage - 1) * animalsPerPage, currentPage * animalsPerPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [query, statusFilter])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

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

  function resetPhotos() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
    setPhotos([])
  }

  function openCreateForm() {
    setFormState(emptyAnimalForm)
    setFormErrors({})
    setFeedback(null)
    resetPhotos()
    setFormMode('create')
    setIsDetailOpen(true)
  }

  function openEditForm(animal: Animal) {
    setSelectedId(animal.id)
    setFormState(getFormFromAnimal(animal))
    setFormErrors({})
    setFeedback(null)
    resetPhotos()
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
    if (isSubmittingForm) return

    const species = formState.species
    if (!species) return

    setIsSubmittingForm(true)
    try {
      const age = Number(formState.age_years)
      const normalizedAge = Number.isFinite(age) && age >= 0 ? age : 0
      const description = formState.description.trim() || 'No description provided yet.'

      const photoUpload = await uploadAnimalPhotos(photos)
      if (!photoUpload.ok) {
        setFeedback({ tone: 'error', message: photoUpload.error })
        return
      }

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
          photo_urls: photoUpload.urls,
        })

        if (createdAnimal) {
          setSelectedId(createdAnimal.id)
          setFormMode(null)
          resetPhotos()
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
        photo_urls: [...selectedAnimal.photo_urls, ...photoUpload.urls],
      })

      if (didSave) {
        setFormMode(null)
        resetPhotos()
        setFeedback({ tone: 'success', message: `${formState.name.trim()} was updated.` })
      } else {
        setFeedback({ tone: 'error', message: 'Animal update failed. Changes were rolled back.' })
      }
    } finally {
      setIsSubmittingForm(false)
    }
  }

  const isSaving =
    isSubmittingForm || isCreating || Boolean(selectedAnimal && pendingAnimalIds.has(selectedAnimal.id))
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

          <div className="mt-5 grid items-start gap-5 sm:grid-cols-2">
            {pagedAnimals.map((animal) => (
                <InventoryAnimalCard
                  key={animal.id}
                  animal={animal}
                  selected={selectedAnimal?.id === animal.id}
                  onSelect={() => selectAnimal(animal)}
                />
            ))}
          </div>

          {visibleAnimals.length > animalsPerPage ? (
            <InventoryPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={visibleAnimals.length}
              onPageChange={setCurrentPage}
            />
          ) : null}

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

          {formMode ? (
            <AnimalFormPanel
              key={formMode === 'edit' ? selectedAnimal?.id : 'create'}
              formState={formState}
              formErrors={formErrors}
              formMode={formMode}
              isSaving={isSaving}
              photos={photos}
              onPhotosChange={setPhotos}
              onFieldChange={updateFormField}
              onSubmit={submitAnimalForm}
              onCancel={() => {
                setFormMode(null)
                setFormErrors({})
                resetPhotos()
              }}
            />
          ) : selectedAnimal ? (
            <>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <img
                  src={getAnimalDisplayImage(selectedAnimal)}
                  alt={`${selectedAnimal.name}, ${selectedAnimal.breed}`}
                  className="h-48 w-full object-cover"
                  style={{ objectFit: 'cover', objectPosition: 'center center' }}
                />
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

              <SocialPostCard socialPost={selectedAnimal.social_post} />

              <div className="mt-4 grid gap-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    disabled={pendingAnimalIds.has(selectedAnimal.id) || selectedAnimal.status === status}
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

function InventoryAnimalCard({
  animal,
  selected,
  onSelect,
}: {
  animal: Animal
  selected: boolean
  onSelect: () => void
}) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.currentTarget !== event.target) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${animal.name}`}
      aria-pressed={selected}
      data-selected={selected ? 'true' : undefined}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={`group flex h-[360px] flex-col overflow-hidden rounded-[1.5rem] border bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 sm:h-[380px] ${
        selected ? 'border-violet-500 ring-4 ring-violet-100' : 'border-slate-200 hover:border-violet-200'
      }`}
    >
      <div
        className="relative shrink-0 overflow-hidden bg-slate-100"
        style={{ height: 208, minHeight: 208, maxHeight: 208 }}
      >
        <img
          src={getAnimalDisplayImage(animal)}
          alt={`${animal.name}, ${animal.breed}`}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          style={{ objectFit: 'cover', objectPosition: 'center center' }}
        />
        <div className="absolute left-3 top-3 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-black text-slate-700 shadow-sm">
          {animal.species === 'dog' ? 'Dog' : animal.species === 'cat' ? 'Cat' : 'Pet'}
        </div>
        <div className="absolute bottom-3 right-3">
          <StatusBadge label={animal.status.replace('_', ' ')} tone={animalStatusTone(animal.status)} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="min-w-0">
          <h3 className="truncate text-xl font-black tracking-tight text-slate-950">{animal.name}</h3>
          <p className="mt-2 truncate text-sm font-bold text-slate-500">{animal.breed}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs font-black text-slate-500">
          <span>{animal.age_years} yrs · {animal.size}</span>
          <span className="text-violet-700">Details</span>
        </div>
      </div>
    </article>
  )
}

function InventoryPagination({
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  totalCount: number
  onPageChange: (page: number) => void
}) {
  function goToPage(page: number) {
    onPageChange(Math.max(1, Math.min(totalPages, page)))
  }

  return (
    <nav
      className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      aria-label="Animal inventory pages"
    >
      <p className="px-2 text-sm font-bold text-slate-500">
        Page {currentPage} of {totalPages} · {totalCount} animals
      </p>
      <div className="flex items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-10 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, index) => {
          const page = index + 1
          return (
            <button
              key={page}
              type="button"
              onClick={() => goToPage(page)}
              aria-current={currentPage === page ? 'page' : undefined}
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-sm font-black transition ${
                currentPage === page
                  ? 'border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-200'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-700'
              }`}
            >
              {page}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-10 rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:border-violet-200 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
        </button>
      </div>
    </nav>
  )
}

function SocialPostCard({ socialPost }: { socialPost: string | null }) {
  const [wasCopied, setWasCopied] = useState(false)

  async function copyPost() {
    if (!socialPost) return
    try {
      await navigator.clipboard.writeText(socialPost)
      setWasCopied(true)
      setTimeout(() => setWasCopied(false), 2000)
    } catch {
      // Clipboard write can fail (insecure context, denied permission) — leave
      // the button label unchanged rather than throwing an unhandled rejection.
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Social post (AI-generated)</p>
        {socialPost ? (
          <button
            type="button"
            onClick={copyPost}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-violet-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50"
          >
            {wasCopied ? 'Copied!' : 'Copy'}
          </button>
        ) : null}
      </div>
      {socialPost ? (
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{socialPost}</p>
      ) : (
        <p className="mt-2 text-sm font-semibold text-slate-400">Generating... check back in a few seconds.</p>
      )}
    </div>
  )
}
