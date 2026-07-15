'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/shared/Badge'
import { Button } from '@/components/shared/Button'
import { DashboardCard } from '@/components/shared/DashboardCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { SectionTitle } from '@/components/shared/SectionTitle'
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
    <ShelterHubLayout
      active="Documents"
      title="Shelter documents"
      subtitle="Prepare adoption policies and care information for the future shelter assistant."
      action={<StatusBadge label={`${documents.length} files`} tone="purple" />}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <section>
          <DashboardCard>
            <SectionTitle
              title="Document library"
              description="Files are mock records today, shaped around the future RAG ingestion workflow."
            />
          </DashboardCard>

          <div className="mt-4 grid gap-3">
            {documents.map((document) => (
              <DashboardCard key={document.id} interactive>
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-xs font-black text-violet-700">
                    PDF
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">{document.file_name}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {document.chunk_count ? `${document.chunk_count} chunks indexed` : 'Waiting for processing'}
                        </p>
                      </div>
                      <StatusBadge label={document.status} tone={documentTone[document.status]} />
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          document.status === 'ready'
                            ? 'bg-teal-600'
                            : document.status === 'failed'
                              ? 'bg-rose-600'
                              : 'bg-violet-600'
                        }`}
                        style={{ width: document.status === 'ready' ? '100%' : document.status === 'failed' ? '35%' : '62%' }}
                      />
                    </div>
                  </div>
                </div>
              </DashboardCard>
            ))}
          </div>

          {documents.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No documents uploaded" description="Upload adoption policies to prepare assistant answers." />
            </div>
          ) : null}
        </section>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <DashboardCard className="border-violet-200 bg-gradient-to-br from-violet-50 to-white">
            <SectionTitle title="Upload PDF" description="Mock-only upload. No API route is called and no file leaves the browser." />

            <button
              onClick={startUpload}
              className="mt-5 w-full rounded-2xl border border-dashed border-violet-300 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-600 text-sm font-black text-white">
                +
              </div>
              <p className="mt-3 text-sm font-black text-slate-950">Choose document</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">PDF up to 10MB</p>
            </button>

            {isUploading || progress > 0 ? (
              <div className="mt-4 rounded-2xl border border-violet-200 bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-black text-slate-950">Uploading mock file</p>
                  <Badge tone="violet">{progress}%</Badge>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-violet-600" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : null}

            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Processing timeline</p>
              <div className="mt-3 space-y-3">
                {[
                  ['Upload', progress > 0 ? 'Complete' : 'Ready'],
                  ['Extract text', progress >= 60 ? 'Queued' : 'Waiting'],
                  ['Index chunks', progress === 100 ? 'Processing' : 'Waiting'],
                ].map(([step, status], index) => (
                  <div key={step} className="flex gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-[11px] font-black text-slate-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-950">{step}</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">{status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={startUpload} className="mt-5" fullWidth disabled={isUploading}>
              Start mock upload
            </Button>
          </DashboardCard>
        </aside>
      </div>
    </ShelterHubLayout>
  )
}
