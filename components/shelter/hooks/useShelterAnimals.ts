'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createAnimal as createAnimalRequest,
  fetchDashboardAnimals,
  patchAnimal,
  type CreateAnimalPayload,
  type PatchAnimalPayload,
} from '@/components/shelter/dashboard-api'
import { animals as fallbackAnimals, type Animal, type AnimalStatus } from '@/lib/mock-data'

type UseShelterAnimalsOptions = {
  shelterId: string
  shelter: Animal['shelter']
}

export function useShelterAnimals({ shelterId, shelter }: UseShelterAnimalsOptions) {
  const [data, setData] = useState<Animal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)
  const [pendingAnimalIds, setPendingAnimalIds] = useState<Set<string>>(new Set())
  const [isCreating, setIsCreating] = useState(false)
  const requestIdRef = useRef(0)

  const setAnimalPending = useCallback((animalId: string, pending: boolean) => {
    setPendingAnimalIds((current) => {
      const next = new Set(current)
      if (pending) next.add(animalId)
      else next.delete(animalId)
      return next
    })
  }, [])

  const refetch = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setIsLoading(true)
    setError(null)

    const result = await fetchDashboardAnimals(shelterId, shelter, fallbackAnimals)

    if (requestIdRef.current !== requestId) return

    setData(result.data)
    setIsFallback(result.isFallback)
    setError(result.error)
    setIsLoading(false)
  }, [shelter, shelterId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const updateAnimalStatus = useCallback(
    async (animalId: string, status: AnimalStatus) => {
      const previousData = data
      setMutationError(null)
      setAnimalPending(animalId, true)
      setData((current) =>
        current.map((animal) => (animal.id === animalId ? { ...animal, status } : animal)),
      )

      try {
        await patchAnimal(animalId, { status })
        return true
      } catch (error) {
        setData(previousData)
        setMutationError(error instanceof Error ? error.message : 'Could not update animal status')
        return false
      } finally {
        setAnimalPending(animalId, false)
      }
    },
    [data, setAnimalPending],
  )

  const updateAnimalDetails = useCallback(
    async (animalId: string, patch: PatchAnimalPayload) => {
      const previousData = data
      setMutationError(null)
      setAnimalPending(animalId, true)
      setData((current) =>
        current.map((animal) => (animal.id === animalId ? { ...animal, ...patch } : animal)),
      )

      try {
        await patchAnimal(animalId, patch)
        return true
      } catch (error) {
        setData(previousData)
        setMutationError(error instanceof Error ? error.message : 'Could not update animal details')
        return false
      } finally {
        setAnimalPending(animalId, false)
      }
    },
    [data, setAnimalPending],
  )

  const createAnimal = useCallback(
    async (payload: CreateAnimalPayload) => {
      const temporaryId = `local-animal-${Date.now()}`
      const localAnimal: Animal = {
        id: temporaryId,
        ...payload,
        status: 'available',
        social_post: null,
        shelter,
        created_at: new Date().toISOString(),
      }
      const previousData = data

      setMutationError(null)
      setIsCreating(true)
      setData((current) => [localAnimal, ...current])

      try {
        const result = await createAnimalRequest(shelterId, payload)
        const createdId = result.animal?.id ?? temporaryId
        const createdAt = result.animal?.created_at ?? localAnimal.created_at
        setData((current) =>
          current.map((animal) =>
            animal.id === temporaryId ? { ...animal, id: createdId, created_at: createdAt } : animal,
          ),
        )
        return { ...localAnimal, id: createdId, created_at: createdAt }
      } catch (error) {
        setData(previousData)
        setMutationError(error instanceof Error ? error.message : 'Could not create animal')
        return null
      } finally {
        setIsCreating(false)
      }
    },
    [data, shelter, shelterId],
  )

  return useMemo(
    () => ({
      data,
      isLoading,
      error,
      mutationError,
      isFallback,
      isEmpty: !isLoading && data.length === 0,
      refetch,
      pendingAnimalIds,
      isCreating,
      updateAnimalStatus,
      updateAnimalDetails,
      createAnimal,
    }),
    [
      createAnimal,
      data,
      error,
      isCreating,
      isFallback,
      isLoading,
      mutationError,
      pendingAnimalIds,
      refetch,
      updateAnimalDetails,
      updateAnimalStatus,
    ],
  )
}
