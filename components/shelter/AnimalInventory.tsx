'use client'

import { useMemo, useState } from 'react'
import { AnimalCard } from '@/components/shared/AnimalCard'
import { StatusBadge, animalStatusTone } from '@/components/shared/StatusBadge'
import { ShelterHubLayout } from '@/components/shelter/ShelterHubLayout'
import { animals as initialAnimals, type Animal, type AnimalStatus } from '@/lib/mock-data'

type StatusFilter = 'all' | AnimalStatus

const statuses: AnimalStatus[] = ['available', 'in_process', 'adopted']

export function AnimalInventory() {
  const [animals, setAnimals] = useState<Animal[]>(initialAnimals)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedId, setSelectedId] = useState(initialAnimals[0]?.id ?? '')
  const [isEditing, setIsEditing] = useState(false)
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
    <ShelterHubLayout active="Animals">
      <div className="grid gap-4 md:grid-cols-[1fr_170px]">
        <section>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">Animal inventory</h2>
              <p className="mt-1 text-xs text-slate-500">Search and update mock adoption statuses locally.</p>
            </div>
            <StatusBadge label={`${visibleAnimals.length} shown`} tone="purple" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, breed, or species"
              className="flex-1 rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {visibleAnimals.map((animal) => (
              <button key={animal.id} onClick={() => selectAnimal(animal)} className="text-left">
                <AnimalCard animal={animal} compact />
              </button>
            ))}
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          {selectedAnimal ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold">Animal details</h3>
                <StatusBadge
                  label={selectedAnimal.status.replace('_', ' ')}
                  tone={animalStatusTone(selectedAnimal.status)}
                />
              </div>

              <div className="mt-3 grid h-20 place-items-center rounded bg-violet-50 text-2xl">
                {selectedAnimal.species}
              </div>

              <div className="mt-3">
                {isEditing ? (
                  <input
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    className="w-full rounded border border-violet-200 px-3 py-2 text-sm font-bold text-slate-950"
                  />
                ) : (
                  <h4 className="text-lg font-black tracking-tight">{selectedAnimal.name}</h4>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {selectedAnimal.breed} - {selectedAnimal.age_years}y - {selectedAnimal.size}
                </p>
                <p className="mt-3 text-xs leading-5 text-slate-600">{selectedAnimal.description}</p>
              </div>

              <div className="mt-3 space-y-2">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(status)}
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-bold text-slate-700"
                  >
                    Mark {status.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                {isEditing ? (
                  <>
                    <button onClick={saveDraft} className="flex-1 rounded bg-violet-600 px-3 py-2 text-xs font-bold text-white">
                      Save
                    </button>
                    <button onClick={() => setIsEditing(false)} className="flex-1 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="w-full rounded bg-violet-600 px-3 py-2 text-xs font-bold text-white">
                    Edit mock details
                  </button>
                )}
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </ShelterHubLayout>
  )
}
