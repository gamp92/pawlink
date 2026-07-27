'use client'

import { useRef, type ChangeEvent } from 'react'
import { Button } from '@/components/shared/Button'
import { DashboardCard } from '@/components/shared/DashboardCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { SectionTitle } from '@/components/shared/SectionTitle'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ShelterHubLayout } from '@/components/shelter/ShelterHubLayout'
import { useShelterWorkspace } from '@/components/shelter/ShelterWorkspaceContext'
import { useShelterDocuments } from '@/components/shelter/hooks/useShelterDocuments'

export function DocumentsManager() {
  const { shelterId } = useShelterWorkspace()
  const {
    documents,
    isLoading,
    error,
    isUploading,
    uploadError,
    pendingDeleteIds,
    uploadDocument,
    removeDocument,
  } = useShelterDocuments(shelterId)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const maxDocumentSizeBytes = 10 * 1024 * 1024

  function openFilePicker() {
    fileInputRef.current?.click()
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.type !== 'application/pdf') {
      window.alert('Please choose a PDF document.')
      return
    }
    if (file.size > maxDocumentSizeBytes) {
      window.alert('PDF files must be 10MB or smaller.')
      return
    }
    await uploadDocument(file)
  }

  async function confirmRemoveDocument(documentId: string, fileName: string) {
    const confirmed = window.confirm(`Delete "${fileName}" from this shelter library?`)
    if (!confirmed) return
    await removeDocument(documentId)
  }

  return (
    <ShelterHubLayout
      active="Documents"
      title="Shelter documents"
      subtitle="Upload adoption policies and care information for your team."
      action={<StatusBadge label={`${documents.length} files`} tone="purple" />}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <section>
          <DashboardCard>
            <SectionTitle
              title="Document library"
              description="PDFs you upload here are stored securely and only visible to your shelter."
            />
          </DashboardCard>

          {error ? (
            <div className="mt-4">
              <ErrorState title="Could not load documents" description={error} />
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-4">
              <LoadingState label="Loading shelter documents" />
            </div>
          ) : null}

          {!isLoading && !error ? (
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
                          {new Date(document.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge label={document.status} tone="green" />
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => confirmRemoveDocument(document.id, document.file_name)}
                          disabled={pendingDeleteIds.has(document.id)}
                        >
                          {pendingDeleteIds.has(document.id) ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </DashboardCard>
            ))}
          </div>
          ) : null}

          {!isLoading && !error && documents.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No documents uploaded" description="Upload adoption policies to keep your team aligned." />
            </div>
          ) : null}
        </section>

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <DashboardCard className="border-violet-200 bg-gradient-to-br from-violet-50 to-white">
            <SectionTitle title="Upload PDF" description="PDF files only, up to 10MB." />

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileSelected}
            />

            <button
              onClick={openFilePicker}
              disabled={isUploading}
              className="mt-5 w-full rounded-2xl border border-dashed border-violet-300 bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-600 text-sm font-black text-white">
                +
              </div>
              <p className="mt-3 text-sm font-black text-slate-950">
                {isUploading ? 'Uploading...' : 'Choose document'}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">PDF up to 10MB</p>
            </button>

            {uploadError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
                {uploadError}
              </div>
            ) : null}
          </DashboardCard>
        </aside>
      </div>
    </ShelterHubLayout>
  )
}
