'use client'

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react'
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
type DecisionType = 'approve' | 'reject'
type RejectionReason = 'profile_mismatch' | 'incomplete_information' | 'animal_unavailable' | 'shelter_policy' | 'other'

const requestTone: Record<RequestStatus, 'purple' | 'teal' | 'red' | 'slate' | 'amber' | 'green'> = {
  pending: 'amber',
  seen: 'purple',
  approved: 'green',
  rejected: 'red',
}

const statusLabels: Record<RequestStatus, string> = {
  pending: 'Pending',
  seen: 'Seen',
  approved: 'Approved',
  rejected: 'Rejected',
}

const livingSpaceLabels: Record<NonNullable<AdoptionRequest['family']['living_space']>, string> = {
  apartment: 'Apartment',
  house_no_yard: 'House',
  house_yard: 'House with yard',
}

const rejectionReasonLabels: Record<RejectionReason, string> = {
  profile_mismatch: 'Profile mismatch',
  incomplete_information: 'Incomplete information',
  animal_unavailable: 'Animal no longer available',
  shelter_policy: 'Shelter policy',
  other: 'Other',
}

function applicantName(request: AdoptionRequest) {
  return request.family.full_name?.trim() || 'Applicant name not provided'
}

function applicantEmail(request: AdoptionRequest) {
  return request.family.email?.trim() || 'Email not provided'
}

function applicantPhone(request: AdoptionRequest) {
  return request.family.phone?.trim() || 'Phone not provided'
}

function animalName(request: AdoptionRequest) {
  return request.animal?.name ?? 'Animal unavailable'
}

function livingSpaceLabel(value: AdoptionRequest['family']['living_space']) {
  return value ? livingSpaceLabels[value] : 'Living space not provided'
}

function booleanSignal(value: boolean | null, positive: string, negative: string) {
  if (value === null) return 'Not provided'
  return value ? positive : negative
}

function childrenSignal(value: boolean | null) {
  if (value === null) return 'Children not provided'
  return value ? 'Children' : 'No children'
}

function formatRequestDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
    date.getUTCMonth()
  ]
  return `${month} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
}

function firstReasons(request: AdoptionRequest) {
  return request.compatibility_reasons.slice(0, 3)
}

function buildRejectionNotes(reason: RejectionReason, internalNotes: string, otherExplanation: string) {
  const reasonText = rejectionReasonLabels[reason]
  const details = reason === 'other' ? otherExplanation.trim() : internalNotes.trim()
  return details ? `Rejected: ${reasonText}. ${details}` : `Rejected: ${reasonText}.`
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
  const [decisionType, setDecisionType] = useState<DecisionType | null>(null)
  const [decisionRequestId, setDecisionRequestId] = useState('')
  const [activeDecision, setActiveDecision] = useState<DecisionType | null>(null)
  const [decisionMessage, setDecisionMessage] = useState<string | null>(null)
  const approveButtonRef = useRef<HTMLButtonElement | null>(null)
  const rejectButtonRef = useRef<HTMLButtonElement | null>(null)
  const selectedRequest = requests.find((request) => request.id === selectedId) ?? requests[0]
  const decisionRequest = requests.find((request) => request.id === decisionRequestId) ?? null
  const isDecisionPending = Boolean(decisionRequest && pendingRequestIds.has(decisionRequest.id))

  useEffect(() => {
    if (!requests.length) {
      setSelectedId('')
      return
    }

    if (!selectedId || !requests.some((request) => request.id === selectedId)) {
      setSelectedId(requests[0].id)
    }
  }, [requests, selectedId])

  function openDecision(type: DecisionType, request: AdoptionRequest) {
    setDecisionMessage(null)
    setDecisionType(type)
    setDecisionRequestId(request.id)
  }

  function closeDecision(force = false) {
    if (isDecisionPending && !force) return
    setDecisionType(null)
    setDecisionRequestId('')
    setActiveDecision(null)
    if (decisionType === 'approve') approveButtonRef.current?.focus()
    if (decisionType === 'reject') rejectButtonRef.current?.focus()
  }

  async function confirmApproval(request: AdoptionRequest) {
    if (pendingRequestIds.has(request.id)) return
    setActiveDecision('approve')
    const didUpdate = await updateRequestStatus(request.id, {
      status: 'approved',
      notes: 'Approved in shelter review.',
    })
    setActiveDecision(null)
    if (didUpdate) {
      setDecisionMessage('Request approved. The applicant may receive an approval email.')
      closeDecision(true)
    }
  }

  async function confirmRejection(request: AdoptionRequest, reason: RejectionReason, notes: string, otherExplanation: string) {
    if (pendingRequestIds.has(request.id)) return
    setActiveDecision('reject')
    const didUpdate = await updateRequestStatus(request.id, {
      status: 'rejected',
      notes: buildRejectionNotes(reason, notes, otherExplanation),
    })
    setActiveDecision(null)
    if (didUpdate) {
      setDecisionMessage('Request rejected. No automatic rejection email was sent.')
      closeDecision(true)
    }
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
          {decisionMessage ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
              {decisionMessage}
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
                  <Avatar name={applicantName(request)} tone={request.status === 'approved' ? 'teal' : 'violet'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">{applicantName(request)}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Wants to meet {animalName(request)}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-400">
                          {formatRequestDate(request.created_at)} · {applicantEmail(request)}
                        </p>
                      </div>
                      <StatusBadge label={statusLabels[request.status]} tone={requestTone[request.status]} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="violet">{Math.round(request.compatibility_score)}% match</Badge>
                      <Badge tone="slate">{livingSpaceLabel(request.family.living_space)}</Badge>
                      <Badge tone={request.family.has_children ? 'green' : 'slate'}>
                        {childrenSignal(request.family.has_children)}
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
              <DetailSection title="Applicant">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar name={applicantName(selectedRequest)} size="lg" />
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-slate-950">{applicantName(selectedRequest)}</h3>
                      <p className="text-xs font-semibold text-slate-500">{applicantEmail(selectedRequest)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">{applicantPhone(selectedRequest)}</p>
                    </div>
                  </div>
                  <StatusBadge label={statusLabels[selectedRequest.status]} tone={requestTone[selectedRequest.status]} />
                </div>
              </DetailSection>

              <DetailSection title="Animal">
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-slate-500">Animal</dt>
                    <dd className="text-right font-bold text-slate-800">{animalName(selectedRequest)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-slate-500">Request date</dt>
                    <dd className="text-right font-bold text-slate-800">{formatRequestDate(selectedRequest.created_at)}</dd>
                  </div>
                </dl>
              </DetailSection>

              <DetailSection title="Compatibility">
                <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-center text-violet-900">
                  <p className="text-4xl font-black">{Math.round(selectedRequest.compatibility_score)}%</p>
                  <p className="mt-1 text-xs font-bold">match with {animalName(selectedRequest)}</p>
                </div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {selectedRequest.compatibility_reasons.length ? (
                    selectedRequest.compatibility_reasons.map((reason) => (
                      <li key={reason} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        {reason}
                      </li>
                    ))
                  ) : (
                    <li className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      No compatibility reasons were provided with this request.
                    </li>
                  )}
                </ul>
              </DetailSection>

              <DetailSection title="Household profile">
                <div className="grid grid-cols-2 gap-2">
                  <Badge tone="slate">{livingSpaceLabel(selectedRequest.family.living_space)}</Badge>
                  <Badge tone={selectedRequest.family.has_children ? 'green' : 'slate'}>
                    {booleanSignal(selectedRequest.family.has_children, 'Has children', 'No children')}
                  </Badge>
                  <Badge tone={selectedRequest.family.has_other_pets ? 'teal' : 'slate'}>
                    {booleanSignal(selectedRequest.family.has_other_pets, 'Other pets', 'No pets')}
                  </Badge>
                  <Badge tone="violet">{animalName(selectedRequest)}</Badge>
                </div>
              </DetailSection>

              <DetailSection title="Shelter notes">
                {selectedRequest.notes ? (
                  <p className="text-sm leading-6 text-slate-600">{selectedRequest.notes}</p>
                ) : (
                  <p className="text-sm leading-6 text-slate-500">No shelter notes yet.</p>
                )}
              </DetailSection>

              <DetailSection title="Decision history/status">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-slate-500">Status</dt>
                    <dd className="text-right font-bold text-slate-800">{statusLabels[selectedRequest.status]}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-slate-500">Last decision note</dt>
                    <dd className="text-right font-bold text-slate-800">{selectedRequest.notes ?? 'Not provided'}</dd>
                  </div>
                </dl>
              </DetailSection>

              <ActionBar className="mt-4 rounded-2xl">
                <Button
                  ref={approveButtonRef}
                  onClick={() => openDecision('approve', selectedRequest)}
                  fullWidth
                  disabled={pendingRequestIds.has(selectedRequest.id)}
                >
                  {activeDecision === 'approve' && pendingRequestIds.has(selectedRequest.id) ? 'Approving...' : 'Approve'}
                </Button>
                <Button
                  ref={rejectButtonRef}
                  onClick={() => openDecision('reject', selectedRequest)}
                  variant="danger"
                  fullWidth
                  disabled={pendingRequestIds.has(selectedRequest.id)}
                >
                  {activeDecision === 'reject' && pendingRequestIds.has(selectedRequest.id) ? 'Rejecting...' : 'Reject'}
                </Button>
              </ActionBar>
            </>
          ) : null}
        </BottomSheet>
      </div>
      {decisionRequest && decisionType === 'approve' ? (
        <ApprovalDialog
          request={decisionRequest}
          isPending={isDecisionPending}
          activeAction={activeDecision}
          returnFocusRef={approveButtonRef}
          onClose={() => closeDecision()}
          onConfirm={() => confirmApproval(decisionRequest)}
        />
      ) : null}
      {decisionRequest && decisionType === 'reject' ? (
        <RejectionDialog
          request={decisionRequest}
          isPending={isDecisionPending}
          activeAction={activeDecision}
          returnFocusRef={rejectButtonRef}
          onClose={() => closeDecision()}
          onConfirm={(reason, notes, otherExplanation) =>
            confirmRejection(decisionRequest, reason, notes, otherExplanation)
          }
        />
      ) : null}
    </ShelterHubLayout>
  )
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="text-sm font-black tracking-tight text-slate-950">{title}</h4>
      <div className="mt-3">{children}</div>
    </section>
  )
}

type DecisionDialogShellProps = {
  title: string
  description: string
  isPending: boolean
  returnFocusRef: RefObject<HTMLButtonElement | null>
  onClose: () => void
  children: ReactNode
}

function DecisionDialogShell({
  title,
  description,
  isPending,
  returnFocusRef,
  onClose,
  children,
}: DecisionDialogShellProps) {
  const titleId = useId()
  const descriptionId = useId()
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isPending) {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      returnFocusRef.current?.focus()
    }
  }, [isPending, onClose, returnFocusRef])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[88vh] w-full overflow-hidden rounded-t-[28px] border border-white/70 bg-white shadow-2xl sm:max-w-xl sm:rounded-[28px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <p className="text-xs font-black text-violet-600">Shelter decision</p>
            <h3 id={titleId} className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              {title}
            </h3>
            <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-lg font-black text-slate-600 shadow-sm transition hover:border-violet-200 hover:text-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close decision dialog"
          >
            ×
          </button>
        </header>
        <div className="max-h-[calc(88vh-140px)] overflow-y-auto p-5">{children}</div>
      </section>
    </div>
  )
}

function DecisionContext({ request }: { request: AdoptionRequest }) {
  const reasons = firstReasons(request)

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <Avatar name={applicantName(request)} tone="violet" />
        <div className="min-w-0 flex-1">
          <p className="font-black text-slate-950">{applicantName(request)}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{applicantEmail(request)}</p>
          <p className="mt-1 text-sm text-slate-500">Requesting {animalName(request)}</p>
        </div>
        <Badge tone="violet">{Math.round(request.compatibility_score)}% match</Badge>
      </div>
      <div className="mt-4 space-y-2">
        {reasons.length ? (
          reasons.map((reason) => (
            <p key={reason} className="rounded-2xl border border-white bg-white p-3 text-sm leading-6 text-slate-600">
              {reason}
            </p>
          ))
        ) : (
          <p className="rounded-2xl border border-white bg-white p-3 text-sm leading-6 text-slate-500">
            No compatibility reasons were provided with this request.
          </p>
        )}
      </div>
    </div>
  )
}

type ApprovalDialogProps = {
  request: AdoptionRequest
  isPending: boolean
  activeAction: DecisionType | null
  returnFocusRef: RefObject<HTMLButtonElement | null>
  onClose: () => void
  onConfirm: () => void
}

function ApprovalDialog({
  request,
  isPending,
  activeAction,
  returnFocusRef,
  onClose,
  onConfirm,
}: ApprovalDialogProps) {
  return (
    <DecisionDialogShell
      title="Approve adoption request?"
      description="Approving this request will update its status and the applicant may receive an approval email."
      isPending={isPending}
      returnFocusRef={returnFocusRef}
      onClose={onClose}
    >
      <DecisionContext request={request} />
      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
        Confirm only when the shelter is ready to move this applicant forward.
      </div>
      <div className="sticky bottom-0 -mx-5 -mb-5 mt-5 flex gap-3 border-t border-slate-100 bg-white p-5">
        <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="button" fullWidth onClick={onConfirm} disabled={isPending}>
          {activeAction === 'approve' && isPending ? 'Approving...' : 'Confirm approval'}
        </Button>
      </div>
    </DecisionDialogShell>
  )
}

type RejectionDialogProps = {
  request: AdoptionRequest
  isPending: boolean
  activeAction: DecisionType | null
  returnFocusRef: RefObject<HTMLButtonElement | null>
  onClose: () => void
  onConfirm: (reason: RejectionReason, notes: string, otherExplanation: string) => void
}

function RejectionDialog({
  request,
  isPending,
  activeAction,
  returnFocusRef,
  onClose,
  onConfirm,
}: RejectionDialogProps) {
  const [reason, setReason] = useState<RejectionReason | ''>('')
  const [internalNotes, setInternalNotes] = useState('')
  const [otherExplanation, setOtherExplanation] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  function submitRejection() {
    if (!reason) {
      setValidationError('Choose a rejection reason before continuing.')
      return
    }

    if (reason === 'other' && !otherExplanation.trim()) {
      setValidationError('Add a short explanation for the other reason.')
      return
    }

    setValidationError(null)
    onConfirm(reason, internalNotes, otherExplanation)
  }

  return (
    <DecisionDialogShell
      title="Reject adoption request?"
      description="The request will be marked as rejected. Automatic rejection email is not currently supported."
      isPending={isPending}
      returnFocusRef={returnFocusRef}
      onClose={onClose}
    >
      <DecisionContext request={request} />
      <fieldset className="mt-5">
        <legend className="text-sm font-black text-slate-950">Rejection reason</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(Object.keys(rejectionReasonLabels) as RejectionReason[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setReason(option)
                setValidationError(null)
              }}
              disabled={isPending}
              aria-pressed={reason === option}
              className={`rounded-2xl border p-3 text-left text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60 ${
                reason === option
                  ? 'border-violet-300 bg-violet-50 text-violet-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-violet-200'
              }`}
            >
              {rejectionReasonLabels[option]}
            </button>
          ))}
        </div>
      </fieldset>
      {reason === 'other' ? (
        <label className="mt-4 block text-sm font-bold text-slate-700">
          Short explanation
          <textarea
            value={otherExplanation}
            onChange={(event) => setOtherExplanation(event.target.value)}
            disabled={isPending}
            className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50"
            placeholder="Briefly describe the reason."
          />
        </label>
      ) : null}
      <label className="mt-4 block text-sm font-bold text-slate-700">
        Internal shelter notes
        <textarea
          value={internalNotes}
          onChange={(event) => setInternalNotes(event.target.value)}
          disabled={isPending}
          className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50"
          placeholder="Optional context for shelter staff."
        />
      </label>
      {validationError ? <p className="mt-3 text-sm font-semibold text-rose-600">{validationError}</p> : null}
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
        Notes and the selected reason are stored as internal shelter notes through the current API.
      </div>
      <div className="sticky bottom-0 -mx-5 -mb-5 mt-5 flex gap-3 border-t border-slate-100 bg-white p-5">
        <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="button" variant="danger" fullWidth onClick={submitRejection} disabled={isPending}>
          {activeAction === 'reject' && isPending ? 'Rejecting...' : 'Confirm rejection'}
        </Button>
      </div>
    </DecisionDialogShell>
  )
}
