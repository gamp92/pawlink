'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteShelterDocument,
  fetchShelterDocuments,
  uploadShelterDocument,
  type UploadedDocument,
} from '@/components/shelter/document-adapter'

export function useShelterDocuments(shelterId: string) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set())
  const requestIdRef = useRef(0)

  const refetch = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchShelterDocuments(shelterId)
      if (requestIdRef.current !== requestId) return
      setDocuments(result)
    } catch (fetchError) {
      if (requestIdRef.current !== requestId) return
      setError(fetchError instanceof Error ? fetchError.message : 'Could not load documents')
    } finally {
      if (requestIdRef.current === requestId) setIsLoading(false)
    }
  }, [shelterId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const uploadDocument = useCallback(
    async (file: File) => {
      setUploadError(null)
      setIsUploading(true)
      const result = await uploadShelterDocument(shelterId, file)
      setIsUploading(false)

      if (!result.ok) {
        setUploadError(result.error)
        return false
      }
      setDocuments((current) => [result.document, ...current])
      return true
    },
    [shelterId],
  )

  const setDeletePending = useCallback((documentId: string, pending: boolean) => {
    setPendingDeleteIds((current) => {
      const next = new Set(current)
      if (pending) next.add(documentId)
      else next.delete(documentId)
      return next
    })
  }, [])

  const removeDocument = useCallback(
    async (documentId: string) => {
      const previousDocuments = documents
      setDeletePending(documentId, true)
      setDocuments((current) => current.filter((document) => document.id !== documentId))

      try {
        await deleteShelterDocument(documentId)
        return true
      } catch (deleteError) {
        setDocuments(previousDocuments)
        setUploadError(deleteError instanceof Error ? deleteError.message : 'Could not delete document')
        return false
      } finally {
        setDeletePending(documentId, false)
      }
    },
    [documents, setDeletePending],
  )

  return {
    documents,
    isLoading,
    error,
    isUploading,
    uploadError,
    pendingDeleteIds,
    uploadDocument,
    removeDocument,
  }
}
