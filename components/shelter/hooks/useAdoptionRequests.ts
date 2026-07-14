'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchDashboardRequests,
  patchAdoptionRequest,
  type PatchAdoptionRequestPayload,
} from '@/components/shelter/dashboard-api'
import { adoptionRequests as fallbackRequests, type AdoptionRequest } from '@/lib/mock-data'

type UseAdoptionRequestsOptions = {
  shelterId: string
}

export function useAdoptionRequests({ shelterId }: UseAdoptionRequestsOptions) {
  const [data, setData] = useState<AdoptionRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)
  const [pendingRequestIds, setPendingRequestIds] = useState<Set<string>>(new Set())
  const requestIdRef = useRef(0)

  const setRequestPending = useCallback((requestId: string, pending: boolean) => {
    setPendingRequestIds((current) => {
      const next = new Set(current)
      if (pending) next.add(requestId)
      else next.delete(requestId)
      return next
    })
  }, [])

  const refetch = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setIsLoading(true)
    setError(null)

    const result = await fetchDashboardRequests(shelterId, fallbackRequests)

    if (requestIdRef.current !== requestId) return

    setData(result.data)
    setIsFallback(result.isFallback)
    setError(result.error)
    setIsLoading(false)
  }, [shelterId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const updateRequestStatus = useCallback(
    async (requestId: string, payload: PatchAdoptionRequestPayload) => {
      const previousData = data
      setMutationError(null)
      setRequestPending(requestId, true)
      setData((current) =>
        current.map((request) =>
          request.id === requestId ? { ...request, status: payload.status, notes: payload.notes } : request,
        ),
      )

      try {
        await patchAdoptionRequest(requestId, payload)
      } catch (error) {
        setData(previousData)
        setMutationError(error instanceof Error ? error.message : 'Could not update adoption request')
      } finally {
        setRequestPending(requestId, false)
      }
    },
    [data, setRequestPending],
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
      pendingRequestIds,
      updateRequestStatus,
    }),
    [data, error, isFallback, isLoading, mutationError, pendingRequestIds, refetch, updateRequestStatus],
  )
}
