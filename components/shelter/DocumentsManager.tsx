'use client'

import { useEffect, useState } from 'react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ShelterHubLayout } from '@/components/shelter/ShelterHubLayout'
import { shelterDocuments, type ShelterDocument } from '@/lib/mock-data'

const documentTone: Record<ShelterDocument['status'], 'purple' | 'teal' | 'red' | 'slate' | 'amber' | 'green'> = {
  ready: 'green',
  processing: 'amber',
  failed: 'red',
}

export function DocumentsManager() {
  const [documents, setDocuments] = useState<ShelterDocument[]>(shelterDocuments)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isUploading) return

    const id = setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          clearInterval(id)
          setIsUploading(false)
          setDocuments((existing) => [
            {
              id: `doc-upload-${existing.length + 1}`,
              file_name: 'nuevo_manual_adopcion.pdf',
              status: 'processing',
              chunk_count: null,
              created_at: '2025-06-14T00:00:00Z',
            },
            ...existing,
          ])
          return 100
        }
        return current + 20
      })
    }, 300)

    return () => clearInterval(id)
  }, [isUploading])

  function startUpload() {
    setProgress(0)
    setIsUploading(true)
  }

  return (
    <ShelterHubLayout active="Documents">
      <div className="grid gap-4 md:grid-cols-[1fr_170px]">
        <section>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">Shelter documents</h2>
              <p className="mt-1 text-xs text-slate-500">Mock upload queue for future RAG assistant sources.</p>
            </div>
            <StatusBadge label={`${documents.length} files`} tone="purple" />
          </div>

          <div className="mt-3 space-y-3">
            {documents.map((document) => (
              <div key={document.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{document.file_name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {document.chunk_count ? `${document.chunk_count} chunks indexed` : 'Waiting for processing'}
                    </p>
                  </div>
                  <StatusBadge label={document.status} tone={documentTone[document.status]} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-lg border border-violet-200 bg-violet-50 p-3 shadow-sm">
          <h3 className="text-sm font-bold text-violet-900">Upload PDF</h3>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Placeholder upload flow. No files leave the browser and no API route is called.
          </p>

          <div className="mt-3 rounded border border-violet-200 bg-white p-3 text-center">
            <p className="text-xs font-bold text-slate-700">Drop document here</p>
            <p className="mt-1 text-[11px] text-slate-400">PDF up to 10MB</p>
          </div>

          {isUploading || progress > 0 ? (
            <div className="mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-violet-600" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-1 text-[11px] font-semibold text-violet-700">{progress}% uploaded</p>
            </div>
          ) : null}

          <button
            onClick={startUpload}
            className="mt-3 w-full rounded bg-violet-600 px-3 py-2 text-xs font-bold text-white"
          >
            Start mock upload
          </button>
        </aside>
      </div>
    </ShelterHubLayout>
  )
}
