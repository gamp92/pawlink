'use client'

import { useState } from 'react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ShelterHubLayout } from '@/components/shelter/ShelterHubLayout'
import { adoptionRequests as initialRequests, type AdoptionRequest } from '@/lib/mock-data'

type RequestStatus = AdoptionRequest['status']

const requestTone: Record<RequestStatus, 'purple' | 'teal' | 'red' | 'slate' | 'amber' | 'green'> = {
  pending: 'amber',
  seen: 'purple',
  approved: 'green',
  rejected: 'red',
}

export function AdoptionRequestsPanel() {
  const [requests, setRequests] = useState<AdoptionRequest[]>(initialRequests)
  const [selectedId, setSelectedId] = useState(initialRequests[0]?.id ?? '')
  const selectedRequest = requests.find((request) => request.id === selectedId) ?? requests[0]

  function updateRequest(status: RequestStatus) {
    if (!selectedRequest) return
    setRequests((current) =>
      current.map((request) =>
        request.id === selectedRequest.id
          ? {
              ...request,
              status,
              notes: status === 'approved' ? 'Approved in mock review.' : 'Rejected in mock review.',
            }
          : request,
      ),
    )
  }

  return (
    <ShelterHubLayout active="Requests">
      <div className="grid gap-4 md:grid-cols-[1fr_170px]">
        <section>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold">Adoption requests</h2>
              <p className="mt-1 text-xs text-slate-500">Review family matches and update request state locally.</p>
            </div>
            <StatusBadge label={`${requests.length} requests`} tone="purple" />
          </div>

          <div className="mt-3 space-y-3">
            {requests.map((request) => (
              <button
                key={request.id}
                onClick={() => setSelectedId(request.id)}
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">{request.family.full_name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Wants to meet {request.animal.name} - {request.compatibility_score}% match
                    </p>
                  </div>
                  <StatusBadge label={request.status} tone={requestTone[request.status]} />
                </div>
              </button>
            ))}
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          {selectedRequest ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold">Request detail</h3>
                <StatusBadge label={selectedRequest.status} tone={requestTone[selectedRequest.status]} />
              </div>

              <div className="mt-3 rounded bg-violet-50 p-3 text-center text-violet-900">
                <p className="text-3xl font-black">{Math.round(selectedRequest.compatibility_score)}%</p>
                <p className="text-[11px] font-semibold">match with {selectedRequest.animal.name}</p>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <p>
                  <strong>Family:</strong> {selectedRequest.family.full_name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedRequest.family.email}
                </p>
                <p>
                  <strong>Home:</strong> {selectedRequest.family.living_space.replace('_', ' ')}
                </p>
                <p>
                  <strong>Children:</strong> {selectedRequest.family.has_children ? 'Yes' : 'No'}
                </p>
                <p>
                  <strong>Other pets:</strong> {selectedRequest.family.has_other_pets ? 'Yes' : 'No'}
                </p>
              </div>

              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Reasons</p>
                <ul className="mt-2 text-xs leading-5 text-slate-600">
                  {selectedRequest.compatibility_reasons.map((reason) => (
                    <li key={reason}>- {reason}</li>
                  ))}
                </ul>
              </div>

              {selectedRequest.notes ? (
                <p className="mt-3 rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                  {selectedRequest.notes}
                </p>
              ) : null}

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => updateRequest('approved')}
                  className="flex-1 rounded bg-violet-600 px-3 py-2 text-xs font-bold text-white"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateRequest('rejected')}
                  className="flex-1 rounded border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"
                >
                  Reject
                </button>
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </ShelterHubLayout>
  )
}
