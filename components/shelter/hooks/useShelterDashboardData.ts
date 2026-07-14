'use client'

import { useMemo } from 'react'
import { useShelterWorkspace } from '@/components/shelter/ShelterWorkspaceContext'
import { useAdoptionRequests } from '@/components/shelter/hooks/useAdoptionRequests'
import { useShelterAnimals } from '@/components/shelter/hooks/useShelterAnimals'

export function useShelterDashboardData() {
  const { shelterId, shelterName } = useShelterWorkspace()
  const shelter = useMemo(() => ({ id: shelterId, name: shelterName, city: 'CDMX' }), [shelterId, shelterName])
  const animals = useShelterAnimals({ shelterId, shelter })
  const requests = useAdoptionRequests({ shelterId })

  const error = [animals.error, requests.error].filter(Boolean).join(' ')
  const isLoading = animals.isLoading || requests.isLoading

  return useMemo(
    () => ({
      animals: animals.data,
      requests: requests.data,
      isLoading,
      error,
      isFallback: animals.isFallback || requests.isFallback,
      isEmpty: animals.isEmpty && requests.isEmpty,
      refetch: async () => {
        await Promise.all([animals.refetch(), requests.refetch()])
      },
    }),
    [animals, error, isLoading, requests],
  )
}
