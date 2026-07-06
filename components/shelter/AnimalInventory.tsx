'use client'

import { useMemo, useState } from 'react'
import { AnimalCard } from '@/components/shared/AnimalCard'
import { ActionBar } from '@/components/shared/ActionBar'
import { Badge } from '@/components/shared/Badge'
import { BottomSheet } from '@/components/shared/BottomSheet'
import { Button } from '@/components/shared/Button'
import { DashboardCard } from '@/components/shared/DashboardCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar } from '@/components/shared/FilterBar'
import { SearchBar } from '@/components/shared/SearchBar'
import { SectionTitle } from '@/components/shared/SectionTitle'
import { StatusBadge, animalStatusTone } from '@/components/shared/StatusBadge'
import { ShelterHubLayout } from '@/components/shelter/ShelterHubLayout'
import { animals as initialAnimals, type Animal, type AnimalStatus } from '@/lib/mock-data'

type StatusFilter = 'all' | AnimalStatus

const statuses: AnimalStatus[] = ['available', 'in_process', 'adopted']
const filterOptions: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Available', value: 'available' },
  { label: 'In process', value: 'in_process' },
  { label: 'Adopted', value: 'adopted' },
]

export function AnimalInventory() {
  const [animals, setAnimals] = useState<Animal[]>(initialAnimals)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedId, setSelectedId] = useState(initialAnimals[0]?.id ?? '')
  const [isEditing, setIsEditing] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const selectedAnimal = animals.find((animal) => animal.id === selectedId) ?? animals[0]
  const [draftName, setDraftName] = useState(selectedAnimal?.name ?? '')

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
    setDraftName(animal.name)
    setIsEditing(false)
    setIsDetailOpen(true)
  }

  function updateStatus(status: AnimalStatus) {
    if (!selectedAnimal) return
    setAnimals((current) =>
      current.map((animal) => (animal.id === selectedAnimal.id ? { ...animal, status } : animal)),
    )
  }

  function saveDraft() {
    if (!selectedAnimal || !draftName.trim()) return
    setAnimals((current) =>
      current.map((animal) =>
        animal.id === selectedAnimal.id ? { ...animal, name: draftName.trim() } : animal,
      ),
    )
    setIsEditing(false)
  }

  return (
    <ShelterHubLayout
      active="Animals"
      title="Animal inventory"
      subtitle="Search, review, and update adoption readiness with a mobile-first inventory flow."
      action={<Button size="sm">New animal</Button>}
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

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {visibleAnimals.map((animal) => (
              <button key={animal.id} onClick={() => selectAnimal(animal)} className="text-left">
                <AnimalCard animal={animal} compact selected={selectedAnimal?.id === animal.id} />
              </button>
            ))}
          </div>

          {visibleAnimals.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No animals match those filters"
                description="Try clearing the search or switching status filters."
                action={<Button variant="secondary" onClick={() => { setQuery(''); setStatusFilter('all') }}>Clear filters</Button>}
              />
            </div>
          ) : null}
        </section>

        <BottomSheet
          open={Boolean(selectedAnimal) && isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Animal details"
          className="lg:sticky lg:top-4 lg:self-start"
        >
          {selectedAnimal ? (
            <>
              <div className="grid h-40 place-items-center rounded-2xl bg-gradient-to-br from-violet-50 to-teal-50 text-5xl font-black text-violet-700">
                {selectedAnimal.name.slice(0, 1)}
              </div>

              <div className="mt-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {isEditing ? (
                    <input
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      className="w-full rounded-xl border border-violet-200 px-3 py-3 text-lg font-black text-slate-950 outline-none"
                    />
                  ) : (
                    <h3 className="truncate text-2xl font-black tracking-tight text-slate-950">{selectedAnimal.name}</h3>
                  )}
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
                {isEditing ? (
                  <>
                    <Button onClick={saveDraft} fullWidth>
                      Save
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="secondary" fullWidth>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} fullWidth>
                    Edit mock details
                  </Button>
                )}
              </ActionBar>
            </>
          ) : null}
        </BottomSheet>
      </div>
    </ShelterHubLayout>
  )
}
