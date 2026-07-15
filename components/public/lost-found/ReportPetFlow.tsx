'use client'

import type { MouseEvent, PointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { FlowProgress } from '@/components/public/lost-found/FlowProgress'
import { LostFoundReportReview } from '@/components/public/lost-found/LostFoundReportReview'
import { LostFoundReportSuccess } from '@/components/public/lost-found/LostFoundReportSuccess'
import { PetInformationStep } from '@/components/public/lost-found/PetInformationStep'
import { ReportLocationStep } from '@/components/public/lost-found/ReportLocationStep'
import { ReportPhotosStep } from '@/components/public/lost-found/ReportPhotosStep'
import { ReporterInformationStep } from '@/components/public/lost-found/ReporterInformationStep'
import { submitAnonymousLostFoundReport } from '@/components/public/lost-found/lost-found-report-adapter'
import type {
  AnonymousLostFoundReportPayload,
  LostFoundFlowStep,
  LostFoundReportForm,
  LostFoundReportSubmissionResult,
} from '@/components/public/lost-found/types'
import { initialLostFoundReportForm } from '@/components/public/lost-found/types'
import { Button } from '@/components/shared/Button'
import { ErrorState } from '@/components/shared/ErrorState'

const reportSteps: Array<{ id: LostFoundFlowStep; label: string; description: string; icon: string }> = [
  { id: 'reporter', label: 'Contact', description: 'Your details', icon: 'ID' },
  { id: 'pet', label: 'Pet', description: 'Pet profile', icon: 'PET' },
  { id: 'location', label: 'Location', description: 'Map pin', icon: 'PIN' },
  { id: 'photos', label: 'Photos', description: 'Images', icon: 'IMG' },
  { id: 'review', label: 'Review', description: 'Submit', icon: 'OK' },
]

const stepTitles: Record<LostFoundFlowStep, string> = {
  reporter: 'Reporter information',
  pet: 'Pet and incident details',
  location: 'Location',
  photos: 'Pet images',
  review: 'Review report',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ReportPetFlow({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [step, setStep] = useState<LostFoundFlowStep>('reporter')
  const [form, setForm] = useState<LostFoundReportForm>(initialLostFoundReportForm)
  const [errors, setErrors] = useState<Partial<Record<keyof LostFoundReportForm, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<LostFoundReportSubmissionResult | null>(null)
  const swipeStartYRef = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeAndReset()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  if (!open) return null

  const stepIndex = reportSteps.findIndex((item) => item.id === step)
  const isFirstStep = stepIndex === 0
  const isReviewStep = step === 'review'
  const currentStepTitle = result ? 'Report prepared' : stepTitles[step]

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

    if (targetStep === 'reporter') {
      if (!form.first_name.trim()) nextErrors.first_name = 'First name is required.'
      if (!form.last_name.trim()) nextErrors.last_name = 'Last name is required.'
      if (!form.email.trim()) nextErrors.email = 'Email is required.'
      else if (!emailPattern.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
      if (!form.contact_consent) nextErrors.contact_consent = 'Consent to email contact is required.'
    }

    if (targetStep === 'pet') {
      if (!form.species) nextErrors.species = 'Choose a species.'
      if (!form.color.trim()) nextErrors.color = 'Color is required.'
      if (!form.size) nextErrors.size = 'Choose a size.'
      if (!form.description.trim()) nextErrors.description = 'Description is required.'
      if (!form.date_lost_or_seen) nextErrors.date_lost_or_seen = 'Date is required.'
    }

    if (targetStep === 'location') {
      if (!form.location_notes.trim()) nextErrors.location_notes = 'Location description is required.'
      if (!form.location) nextErrors.location = 'Choose a point on the map.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateAll() {
    const stepsToValidate: LostFoundFlowStep[] = ['reporter', 'pet', 'location']
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

  function buildPayload(): AnonymousLostFoundReportPayload | null {
    if (!validateAll() || !form.species || !form.size || !form.location) return null

    return {
      reporter: {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        contact_consent: form.contact_consent,
      },
      incident: {
        report_type: form.report_type,
        pet_name: form.pet_name.trim() || undefined,
        species: form.species,
        breed: form.breed.trim() || undefined,
        color: form.color.trim(),
        size: form.size,
        sex: form.sex || undefined,
        description: form.description.trim(),
        date_lost_or_seen: form.date_lost_or_seen,
        location_notes: form.location_notes.trim(),
        location: {
          lat: form.location.lat,
          lng: form.location.lng,
        },
      },
      photos: form.photos.map((photo) => ({
        file_name: photo.file.name,
        file_type: photo.file.type,
        file_size: photo.file.size,
      })),
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
    setStep('reporter')
    setForm(initialLostFoundReportForm)
    setErrors({})
    setSubmitError(null)
    setResult(null)
    setIsSubmitting(false)
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
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
              {step === 'reporter' ? <ReporterInformationStep {...stepProps} /> : null}
              {step === 'pet' ? <PetInformationStep {...stepProps} /> : null}
              {step === 'location' ? <ReportLocationStep {...stepProps} /> : null}
              {step === 'photos' ? <ReportPhotosStep form={form} updateField={updateField} /> : null}
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
                  {isSubmitting ? 'Preparing...' : 'Submit report'}
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
