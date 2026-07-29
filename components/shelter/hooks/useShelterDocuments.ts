'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  deleteShelterDocument,
  fetchShelterDocuments,
  uploadShelterDocument,
  type UploadedDocument,
} from '@/components/shelter/document-adapter'

const POLL_INTERVAL_MS = 5000
const MAX_POLLS = 24

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

  const isIndexing = documents.some((document) => document.status === 'processing')

  useEffect(() => {
    if (!isIndexing) return

    let polls = 0
    let isActive = true

    const timer = setInterval(async () => {
      polls += 1
      if (polls > MAX_POLLS) {
        clearInterval(timer)
        return
      }

      try {
        const result = await fetchShelterDocuments(shelterId)
        if (isActive) setDocuments(result)
      } catch {
        return
      }
    }, POLL_INTERVAL_MS)

    return () => {
      isActive = false
      clearInterval(timer)
    }
  }, [isIndexing, shelterId])

  const findByFileName = useCallback(
    (fileName: string) => documents.find((document) => document.file_name === fileName),
    [documents],
  )

  const uploadDocument = useCallback(
    async (file: File, replaceDocumentId?: string) => {
      setUploadError(null)
      setIsUploading(true)

      if (replaceDocumentId) {
        try {
          await deleteShelterDocument(replaceDocumentId)
          setDocuments((current) => current.filter((document) => document.id !== replaceDocumentId))
        } catch (deleteError) {
          setIsUploading(false)
          setUploadError(
            deleteError instanceof Error
              ? `Could not replace the previous version: ${deleteError.message}`
              : 'Could not replace the previous version.',
          )
          return false
        }
      }

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
    isIndexing,
    uploadError,
    pendingDeleteIds,
    findByFileName,
    uploadDocument,
    removeDocument,
  }
}
