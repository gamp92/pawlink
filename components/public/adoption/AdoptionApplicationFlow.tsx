'use client'

import type { MouseEvent, PointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ApplicationReviewStep } from '@/components/public/adoption/ApplicationReviewStep'
import { ApplicationSuccess } from '@/components/public/adoption/ApplicationSuccess'
import { ContactInformationStep } from '@/components/public/adoption/ContactInformationStep'
import {
  adoptionApplicationSteps,
  QuestionnaireProgress,
} from '@/components/public/adoption/QuestionnaireProgress'
import { SelectedPetSummary } from '@/components/public/adoption/SelectedPetSummary'
import { submitAnonymousAdoptionApplication } from '@/components/public/adoption/adoption-application-adapter'
import { Button } from '@/components/shared/Button'
import { ErrorState } from '@/components/shared/ErrorState'
import type {
  AdoptionFamilyProfile,
  AdoptionApplicationForm,
  AdoptionApplicationResult,
  AdoptionApplicationStep,
  AnonymousAdoptionApplicationPayload,
  SelectedAdoptionMatch,
} from '@/components/public/adoption/types'
import { initialAdoptionApplicationForm } from '@/components/public/adoption/types'

const stepTitles: Record<AdoptionApplicationStep, string> = {
  contact: 'Contact information',
  review: 'Review application',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AdoptionApplicationFlow({
  match,
  familyProfile,
  open,
  onClose,
}: {
  match: SelectedAdoptionMatch | null
  familyProfile: AdoptionFamilyProfile
  open: boolean
  onClose: () => void
}) {
  const [step, setStep] = useState<AdoptionApplicationStep>('contact')
  const [form, setForm] = useState<AdoptionApplicationForm>(initialAdoptionApplicationForm)
  const [errors, setErrors] = useState<Partial<Record<keyof AdoptionApplicationForm, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<AdoptionApplicationResult | null>(null)
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

  if (!open || !match) return null

  const activeMatch = match
  const stepIndex = adoptionApplicationSteps.findIndex((item) => item.id === step)
  const isFirstStep = stepIndex === 0
  const isReviewStep = step === 'review'

  function updateField<Field extends keyof AdoptionApplicationForm>(
    field: Field,
    value: AdoptionApplicationForm[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitError(null)
  }

  function validateStep(targetStep: AdoptionApplicationStep) {
    const nextErrors: Partial<Record<keyof AdoptionApplicationForm, string>> = {}

    if (targetStep === 'contact') {
      if (!form.first_name.trim()) nextErrors.first_name = 'First name is required.'
      if (!form.last_name.trim()) nextErrors.last_name = 'Last name is required.'
      if (!form.email.trim()) nextErrors.email = 'Email is required.'
      else if (!emailPattern.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateThroughReview() {
    const stepsToValidate: AdoptionApplicationStep[] = ['contact']
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
    const nextStep = adoptionApplicationSteps[stepIndex + 1]?.id
    if (nextStep) setStep(nextStep)
  }

  function goBack() {
    const previousStep = adoptionApplicationSteps[stepIndex - 1]?.id
    if (previousStep) setStep(previousStep)
  }

  function buildPayload(): AnonymousAdoptionApplicationPayload | null {
    if (!validateThroughReview()) return null

    return {
      animal_id: activeMatch.animal.id,
      shelter_id: activeMatch.animal.shelter.id,
      compatibility_score: activeMatch.score,
      compatibility_reasons: activeMatch.reasons,
      applicant: {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
      },
      family_profile: familyProfile,
    }
  }

  async function submitApplication() {
    if (isSubmitting) return

    const payload = buildPayload()
    if (!payload) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const submissionResult = await submitAnonymousAdoptionApplication(payload)
      setResult(submissionResult)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit the application.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function closeAndReset() {
    onClose()
    setStep('contact')
    setForm(initialAdoptionApplicationForm)
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
    if (event.clientY - startY > 90 && !isSubmitting) {
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
        aria-labelledby="adoption-application-title"
        aria-describedby="adoption-application-description"
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
                <p className="report-flow-kicker">Adoption request</p>
                <h2 id="adoption-application-title" className="report-flow-title">
                {result ? 'Application received' : stepTitles[step]}
                </h2>
                <p id="adoption-application-description" className="report-flow-description">
                  {result
                    ? 'The shelter will review your request and contact you by email.'
                    : 'This sends your contact details and existing match profile to the shelter for review.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeAndReset}
              className="report-flow-close"
              aria-label="Close adoption application"
            >
              x
            </button>
          </div>
          {!result ? (
            <div className="report-flow-progress-wrap">
              <QuestionnaireProgress currentStep={step} onSelectStep={setStep} />
            </div>
          ) : null}
        </div>

        <div className="report-flow-body">
          {result ? (
            <div className="report-flow-content">
              <ApplicationSuccess match={activeMatch} result={result} onClose={closeAndReset} />
            </div>
          ) : (
            <div className="report-flow-content space-y-4 transition duration-300">
              <SelectedPetSummary match={activeMatch} compact={step !== 'review'} />
              {step === 'contact' ? <ContactInformationStep {...stepProps} /> : null}
              {step === 'review' ? (
                <ApplicationReviewStep
                  form={form}
                  familyProfile={familyProfile}
                  onEdit={setStep}
                />
              ) : null}
              {submitError ? <ErrorState title="Application not sent" description={submitError} /> : null}
            </div>
          )}
        </div>

        {!result ? (
          <div className="report-flow-footer">
            <div className="report-flow-footer-inner">
              <Button
                type="button"
                variant="secondary"
                onClick={goBack}
                fullWidth
                disabled={isFirstStep || isSubmitting}
              >
                Back
              </Button>
              {isReviewStep ? (
                <Button type="button" onClick={submitApplication} fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Submit application'}
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
