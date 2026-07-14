'use client'

import { useEffect, useState } from 'react'
import { ActionBar } from '@/components/shared/ActionBar'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/shared/Badge'
import { BottomSheet } from '@/components/shared/BottomSheet'
import { Button } from '@/components/shared/Button'
import { DashboardCard } from '@/components/shared/DashboardCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { SectionTitle } from '@/components/shared/SectionTitle'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ShelterHubLayout } from '@/components/shelter/ShelterHubLayout'
import { useShelterWorkspace } from '@/components/shelter/ShelterWorkspaceContext'
import { useAdoptionRequests } from '@/components/shelter/hooks/useAdoptionRequests'
import type { AdoptionRequest } from '@/lib/mock-data'

type RequestStatus = AdoptionRequest['status']

const requestTone: Record<RequestStatus, 'purple' | 'teal' | 'red' | 'slate' | 'amber' | 'green'> = {
  pending: 'amber',
  seen: 'purple',
  approved: 'green',
  rejected: 'red',
}

export function AdoptionRequestsPanel() {
  const { shelterId } = useShelterWorkspace()
  const {
    data: requests,
    isLoading,
    error,
    mutationError,
    isFallback,
    isEmpty,
    pendingRequestIds,
    updateRequestStatus,
  } = useAdoptionRequests({ shelterId })
  const [selectedId, setSelectedId] = useState('')
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const selectedRequest = requests.find((request) => request.id === selectedId) ?? requests[0]

  useEffect(() => {
    if (!requests.length) {
      setSelectedId('')
      return
    }

    if (!selectedId || !requests.some((request) => request.id === selectedId)) {
      setSelectedId(requests[0].id)
    }
  }, [requests, selectedId])

  function updateRequest(status: RequestStatus) {
    if (!selectedRequest) return
    const notes = status === 'approved' ? 'Approved in shelter review.' : 'Rejected in shelter review.'
    updateRequestStatus(selectedRequest.id, { status, notes })
  }

  return (
    <ShelterHubLayout
      active="Requests"
      title="Adoption inbox"
      subtitle="Review applicants, compatibility context, and local approval decisions from one focused inbox."
      action={<StatusBadge label={`${requests.length} requests`} tone="purple" />}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section>
          <DashboardCard>
            <SectionTitle
              title="Applicant queue"
              description="Newest requests appear first with compatibility and household signals."
            />
          </DashboardCard>

          {isLoading ? (
            <div className="mt-4">
              <LoadingState label="Loading adoption requests" />
            </div>
          ) : null}
          {error ? (
            <div className="mt-4">
              <ErrorState
                title={isFallback ? 'Using fallback requests' : 'Request data issue'}
                description={error}
              />
            </div>
          ) : null}
          {mutationError ? (
            <div className="mt-4">
              <ErrorState title="Update rolled back" description={mutationError} />
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {requests.map((request) => (
              <button
                key={request.id}
                onClick={() => {
                  setSelectedId(request.id)
                  setIsDetailOpen(true)
                }}
                className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
                  selectedRequest?.id === request.id ? 'border-violet-300' : 'border-slate-200'
                }`}
              >
                <div className="flex gap-3">
                  <Avatar name={request.family.full_name} tone={request.status === 'approved' ? 'teal' : 'violet'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">{request.family.full_name}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Wants to meet {request.animal.name}
                        </p>
                      </div>
                      <StatusBadge label={request.status} tone={requestTone[request.status]} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="violet">{Math.round(request.compatibility_score)}% match</Badge>
                      <Badge tone="slate">{request.family.living_space.replace('_', ' ')}</Badge>
                      <Badge tone={request.family.has_children ? 'green' : 'slate'}>
                        {request.family.has_children ? 'Children' : 'No children'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {requests.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No adoption requests yet"
                description={
                  isEmpty
                    ? 'This shelter has no family applications yet.'
                    : 'New family applications will appear here.'
                }
              />
            </div>
          ) : null}
        </section>

        <BottomSheet
          open={Boolean(selectedRequest) && isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Request detail"
          className="lg:sticky lg:top-4 lg:self-start"
        >
          {selectedRequest ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar name={selectedRequest.family.full_name} size="lg" />
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-slate-950">{selectedRequest.family.full_name}</h3>
                    <p className="text-xs font-semibold text-slate-500">{selectedRequest.family.email}</p>
                  </div>
                </div>
                <StatusBadge label={selectedRequest.status} tone={requestTone[selectedRequest.status]} />
              </div>

              <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-center text-violet-900">
                <p className="text-4xl font-black">{Math.round(selectedRequest.compatibility_score)}%</p>
                <p className="mt-1 text-xs font-bold">match with {selectedRequest.animal.name}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Badge tone="slate">{selectedRequest.family.living_space.replace('_', ' ')}</Badge>
                <Badge tone={selectedRequest.family.has_children ? 'green' : 'slate'}>
                  {selectedRequest.family.has_children ? 'Has children' : 'No children'}
                </Badge>
                <Badge tone={selectedRequest.family.has_other_pets ? 'teal' : 'slate'}>
                  {selectedRequest.family.has_other_pets ? 'Other pets' : 'No pets'}
                </Badge>
                <Badge tone="violet">{selectedRequest.animal.name}</Badge>
              </div>

              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Reasons</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                  {selectedRequest.compatibility_reasons.map((reason) => (
                    <li key={reason} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedRequest.notes ? (
                <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                  {selectedRequest.notes}
                </p>
              ) : null}

              <ActionBar className="mt-4 rounded-2xl">
                <Button
                  onClick={() => updateRequest('approved')}
                  fullWidth
                  disabled={pendingRequestIds.has(selectedRequest.id)}
                >
                  Approve
                </Button>
                <Button
                  onClick={() => updateRequest('rejected')}
                  variant="danger"
                  fullWidth
                  disabled={pendingRequestIds.has(selectedRequest.id)}
                >
                  Reject
                </Button>
              </ActionBar>
            </>
          ) : null}
        </BottomSheet>
      </div>
    </ShelterHubLayout>
  )
}
