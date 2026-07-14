'use client'

import { useState } from 'react'
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

const reportSteps: Array<{ id: LostFoundFlowStep; label: string; description: string }> = [
  { id: 'reporter', label: 'Contact', description: 'How helpers reach you' },
  { id: 'pet', label: 'Pet', description: 'What to look for' },
  { id: 'location', label: 'Location', description: 'Where it happened' },
  { id: 'photos', label: 'Photos', description: 'Visual recognition' },
  { id: 'review', label: 'Review', description: 'Final check' },
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

  if (!open) return null

  const stepIndex = reportSteps.findIndex((item) => item.id === step)
  const isFirstStep = stepIndex === 0
  const isReviewStep = step === 'review'

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

  const stepProps = { form, errors, updateField }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 md:grid md:place-items-center md:bg-slate-950/50 md:p-6">
      <section className="flex h-full flex-col bg-slate-50 md:h-auto md:max-h-[92vh] md:w-full md:max-w-4xl md:overflow-hidden md:rounded-[2rem] md:border md:border-white/70 md:bg-white md:shadow-2xl">
        <div className="border-b border-slate-200/70 bg-white/90 p-4 backdrop-blur md:p-5">
          <div className="mx-auto flex max-w-3xl items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-violet-600">Community report</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                {result ? 'Report prepared' : stepTitles[step]}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Share clear details so shelters and neighbors can help quickly.
              </p>
            </div>
            <button
              type="button"
              onClick={closeAndReset}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-sm font-black text-slate-500 shadow-sm transition hover:border-violet-200 hover:text-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-100"
              aria-label="Close report form"
            >
              x
            </button>
          </div>
          {!result ? (
            <div className="mx-auto mt-4 max-w-3xl">
              <FlowProgress steps={reportSteps} currentStep={step} onSelectStep={setStep} />
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {result ? (
            <div className="mx-auto max-w-2xl">
              <LostFoundReportSuccess result={result} onClose={closeAndReset} />
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4 transition duration-300">
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
          <div className="border-t border-slate-200/70 bg-white/95 p-4 shadow-[0_-12px_30px_rgba(15,23,42,0.04)] backdrop-blur">
            <div className="mx-auto flex max-w-3xl gap-3">
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
