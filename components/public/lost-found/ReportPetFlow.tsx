'use client'

import type { MouseEvent, PointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { FlowProgress } from '@/components/public/lost-found/FlowProgress'
import { LostFoundReportReview } from '@/components/public/lost-found/LostFoundReportReview'
import { LostFoundReportSuccess } from '@/components/public/lost-found/LostFoundReportSuccess'
import { PetInformationStep } from '@/components/public/lost-found/PetInformationStep'
import { ReportLocationStep } from '@/components/public/lost-found/ReportLocationStep'
import {
  mapLostFoundReportToApi,
  submitAnonymousLostFoundReport,
  type LostFoundReportApiPayload,
} from '@/components/public/lost-found/lost-found-report-adapter'
import type {
  LostFoundFlowStep,
  LostFoundReportForm,
  LostFoundReportSubmissionResult,
} from '@/components/public/lost-found/types'
import { initialLostFoundReportForm } from '@/components/public/lost-found/types'
import { Button } from '@/components/shared/Button'
import { ErrorState } from '@/components/shared/ErrorState'
import type { LostFoundReport } from '@/lib/mock-data'

const reportSteps: Array<{ id: LostFoundFlowStep; label: string; description: string; icon: string }> = [
  { id: 'pet', label: 'Pet', description: 'What happened', icon: 'Pet' },
  { id: 'location', label: 'Location', description: 'Map pin', icon: 'Map' },
  { id: 'review', label: 'Review', description: 'Confirm', icon: 'Done' },
]

const stepTitles: Record<LostFoundFlowStep, string> = {
  pet: 'Pet and incident details',
  location: 'Location',
  review: 'Review report',
}

export function ReportPetFlow({
  open,
  onClose,
  onSubmitted,
}: {
  open: boolean
  onClose: () => void
  onSubmitted?: (report: LostFoundReport) => void
}) {
  const [step, setStep] = useState<LostFoundFlowStep>('pet')
  const [form, setForm] = useState<LostFoundReportForm>(initialLostFoundReportForm)
  const [errors, setErrors] = useState<Partial<Record<keyof LostFoundReportForm, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<LostFoundReportSubmissionResult | null>(null)
  const swipeStartYRef = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        closeAndReset()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting, open])

  if (!open) return null

  const stepIndex = reportSteps.findIndex((item) => item.id === step)
  const isFirstStep = stepIndex === 0
  const isReviewStep = step === 'review'
  const currentStepTitle = result ? 'Report submitted' : stepTitles[step]

  function updateField<FieldName extends keyof LostFoundReportForm>(
    field: FieldName,
    value: LostFoundReportForm[FieldName],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitError(null)
  }

  function validateStep(targetStep: LostFoundFlowStep) {
    const nextErrors: Partial<Record<keyof LostFoundReportForm, string>> = {}

    if (targetStep === 'pet') {
      if (!form.species) nextErrors.species = 'Choose a species.'
      if (!form.color.trim()) nextErrors.color = 'Color is required.'
      if (!form.description.trim()) nextErrors.description = 'Description is required.'
    }

    if (targetStep === 'location') {
      if (!form.location_notes.trim()) nextErrors.location_notes = 'Location description is required.'
      if (!form.location) nextErrors.location = 'Choose a point on the map.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateAll() {
    const stepsToValidate: LostFoundFlowStep[] = ['pet', 'location']
    for (const item of stepsToValidate) {
      if (!validateStep(item)) {
        setStep(item)
        return false
      }
    }
    return true
  }

  function goNext() {
    if (!validateStep(step)) return
    const nextStep = reportSteps[stepIndex + 1]?.id
    if (nextStep) setStep(nextStep)
  }

  function goBack() {
    const previousStep = reportSteps[stepIndex - 1]?.id
    if (previousStep) setStep(previousStep)
  }

  function buildPayload(): LostFoundReportApiPayload | null {
    if (!validateAll() || !form.species || !form.location) return null
    return mapLostFoundReportToApi(form)
  }

  function buildVisibleReport(submissionResult: LostFoundReportSubmissionResult): LostFoundReport | null {
    if (!form.species || !form.location) return null

    return {
      id: submissionResult.report_id,
      report_type: form.report_type,
      pet_name: form.pet_name.trim() || (form.report_type === 'found' ? 'Unknown pet' : 'Unnamed pet'),
      species: form.species,
      breed: form.breed.trim() || 'Mixed',
      color: form.color.trim(),
      description: form.description.trim(),
      photo_urls: [],
      location: {
        lat: form.location.lat,
        lng: form.location.lng,
      },
      location_notes: form.location_notes.trim(),
      city: form.city.trim() || 'Community area',
      status: submissionResult.status === 'resolved' ? 'resolved' : 'open',
      matched_report_id: null,
      match_confidence: null,
      created_at: submissionResult.submitted_at,
    }
  }

  async function submitReport() {
    const payload = buildPayload()
    if (!payload) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const submissionResult = await submitAnonymousLostFoundReport(payload)
      if (submissionResult.ok) {
        setResult(submissionResult.result)
        const createdReport = buildVisibleReport(submissionResult.result)
        if (createdReport) onSubmitted?.(createdReport)
      } else {
        setSubmitError(submissionResult.error)
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not prepare report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function closeAndReset() {
    form.photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl))
    onClose()
    setStep('pet')
    setForm(initialLostFoundReportForm)
    setErrors({})
    setSubmitError(null)
    setResult(null)
    setIsSubmitting(false)
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && !isSubmitting) {
      closeAndReset()
    }
  }

  function handlePanelPointerDown(event: PointerEvent<HTMLElement>) {
    swipeStartYRef.current = event.clientY
  }

  function handlePanelPointerUp(event: PointerEvent<HTMLElement>) {
    const startY = swipeStartYRef.current
    swipeStartYRef.current = null

    if (startY === null || window.innerWidth >= 768) return
    if (event.clientY - startY > 90) {
      closeAndReset()
    }
  }

  const stepProps = { form, errors, updateField }

  return (
    <div className="report-flow-overlay" onMouseDown={handleBackdropClick}>
      <section
        className="report-flow-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-pet-title"
        aria-describedby="report-pet-description"
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={handlePanelPointerDown}
        onPointerUp={handlePanelPointerUp}
      >
        <div className="report-flow-header">
          <div className="report-flow-grabber" aria-hidden="true" />
          <div className="report-flow-title-row">
            <div className="flex min-w-0 items-start gap-3">
              <div className="report-flow-icon" aria-hidden="true">PET</div>
              <div className="min-w-0">
                <p className="report-flow-kicker">{currentStepTitle}</p>
                <h2 id="report-pet-title" className="report-flow-title">Report a pet</h2>
                <p id="report-pet-description" className="report-flow-description">
                  Share the essentials with neighbors and shelters. You can review everything before sending.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeAndReset}
              className="report-flow-close"
              aria-label="Close report form"
            >
              x
            </button>
          </div>
          {!result ? (
            <div className="report-flow-progress-wrap">
              <FlowProgress steps={reportSteps} currentStep={step} onSelectStep={setStep} />
            </div>
          ) : null}
        </div>

        <div className="report-flow-body">
          {result ? (
            <div className="report-flow-content">
              <LostFoundReportSuccess result={result} onClose={closeAndReset} />
            </div>
          ) : (
            <div className="report-flow-content space-y-4">
              {step === 'pet' ? <PetInformationStep {...stepProps} /> : null}
              {step === 'location' ? <ReportLocationStep {...stepProps} /> : null}
              {step === 'review' ? <LostFoundReportReview form={form} onEdit={setStep} /> : null}
              {submitError ? <ErrorState title="Report not ready" description={submitError} /> : null}
            </div>
          )}
        </div>

        {!result ? (
          <div className="report-flow-footer">
            <div className="report-flow-footer-inner">
              <Button type="button" variant="secondary" onClick={goBack} fullWidth disabled={isFirstStep || isSubmitting}>
                Back
              </Button>
              {isReviewStep ? (
                <Button type="button" onClick={submitReport} fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit report'}
                </Button>
              ) : (
                <Button type="button" onClick={goNext} fullWidth disabled={isSubmitting}>
                  Next
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
