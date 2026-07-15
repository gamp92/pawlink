'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { AlertLocationStep } from '@/components/public/lost-found/AlertLocationStep'
import { AlertSubscriptionSuccess } from '@/components/public/lost-found/AlertSubscriptionSuccess'
import {
  CheckboxField,
  Field,
  inputClassName,
} from '@/components/public/lost-found/form-controls'
import { submitAnonymousAlertSubscription } from '@/components/public/lost-found/alert-subscription-adapter'
import type {
  AlertFlowStep,
  AlertSubscriptionForm,
  AlertSubscriptionResult,
  AnonymousAlertSubscriptionPayload,
} from '@/components/public/lost-found/types'
import { initialAlertSubscriptionForm } from '@/components/public/lost-found/types'
import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { ErrorState } from '@/components/shared/ErrorState'

const alertSteps: Array<{ id: AlertFlowStep; label: string; description: string }> = [
  { id: 'contact', label: 'Contact', description: 'Where to send alerts' },
  { id: 'location', label: 'Area', description: 'Choose your radius' },
  { id: 'review', label: 'Review', description: 'Confirm preference' },
]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AlertSubscriptionFlow({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [step, setStep] = useState<AlertFlowStep>('contact')
  const [form, setForm] = useState<AlertSubscriptionForm>(initialAlertSubscriptionForm)
  const [errors, setErrors] = useState<Partial<Record<keyof AlertSubscriptionForm, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<AlertSubscriptionResult | null>(null)
  const titleId = useId()
  const descriptionId = useId()
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeAndReset()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousFocusRef.current?.focus()
    }
  }, [open])

  if (!open) return null

  const stepIndex = alertSteps.findIndex((item) => item.id === step)
  const isFirstStep = stepIndex === 0
  const isReviewStep = step === 'review'

  function updateField<FieldName extends keyof AlertSubscriptionForm>(
    field: FieldName,
    value: AlertSubscriptionForm[FieldName],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitError(null)
  }

  function validateStep(targetStep: AlertFlowStep) {
    const nextErrors: Partial<Record<keyof AlertSubscriptionForm, string>> = {}

    if (targetStep === 'contact') {
      if (!form.first_name.trim()) nextErrors.first_name = 'First name is required.'
      if (!form.email.trim()) nextErrors.email = 'Email is required.'
      else if (!emailPattern.test(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
      if (!form.email_consent) nextErrors.email_consent = 'Consent to email alerts is required.'
    }

    if (targetStep === 'location') {
      if (!form.location) nextErrors.location = 'Choose an alert location.'
      const radius = Number(form.radius_km)
      if (!form.radius_km.trim() || !Number.isFinite(radius) || radius < 0.5 || radius > 20) {
        nextErrors.radius_km = 'Enter a radius between 0.5 and 20 km.'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateAll() {
    const stepsToValidate: AlertFlowStep[] = ['contact', 'location']
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
    const nextStep = alertSteps[stepIndex + 1]?.id
    if (nextStep) setStep(nextStep)
  }

  function goBack() {
    const previousStep = alertSteps[stepIndex - 1]?.id
    if (previousStep) setStep(previousStep)
  }

  function buildPayload(): AnonymousAlertSubscriptionPayload | null {
    if (!validateAll() || !form.location) return null
    return {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim() || undefined,
      email: form.email.trim(),
      city: form.location.label,
      location: {
        lat: form.location.lat,
        lng: form.location.lng,
      },
      radius_km: Number(form.radius_km),
      email_consent: form.email_consent,
    }
  }

  async function submitSubscription() {
    if (isSubmitting) return

    const payload = buildPayload()
    if (!payload) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const subscriptionResult = await submitAnonymousAlertSubscription(payload)
      if (subscriptionResult.ok) {
        setResult(subscriptionResult.result)
      } else {
        setSubmitError(subscriptionResult.error)
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not prepare alert preference.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function closeAndReset() {
    onClose()
    setStep('contact')
    setForm(initialAlertSubscriptionForm)
    setErrors({})
    setSubmitError(null)
    setResult(null)
    setIsSubmitting(false)
  }

  function resetForAnotherAlert() {
    setStep('contact')
    setForm(initialAlertSubscriptionForm)
    setErrors({})
    setSubmitError(null)
    setResult(null)
    setIsSubmitting(false)
    closeButtonRef.current?.focus()
  }

  return (
    <div className="pawlink-dialog-backdrop" onClick={closeAndReset}>
      <section
        className="pawlink-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/95 p-4 backdrop-blur md:p-5">
          <div className="mx-auto flex max-w-2xl items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-violet-600">Nearby alerts</p>
              <h2 id={titleId} className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                {result ? 'Alert preference ready' : 'Get nearby alerts'}
              </h2>
              <p id={descriptionId} className="mt-1 text-sm leading-6 text-slate-500">
                Choose where you want to hear about lost and found pet activity.
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeAndReset}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-sm font-black text-slate-500 shadow-sm transition hover:border-violet-200 hover:text-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-100"
              aria-label="Close alert subscription"
            >
              x
            </button>
          </div>
          {!result ? (
            <div className="mx-auto mt-4 max-w-2xl">
              <AlertProgress steps={alertSteps} currentStep={step} onSelectStep={setStep} />
            </div>
          ) : null}
        </div>

        <div className="pawlink-dialog-body p-4 md:p-6">
          {result ? (
            <div className="mx-auto max-w-2xl">
              <AlertSubscriptionSuccess
                form={form}
                result={result}
                onClose={closeAndReset}
                onCreateAnother={resetForAnotherAlert}
              />
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-4 transition duration-300">
              {step === 'contact' ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field id="alert-first-name" label="First name" error={errors.first_name}>
                      <input
                        id="alert-first-name"
                        value={form.first_name}
                        onChange={(event) => updateField('first_name', event.target.value)}
                        className={inputClassName}
                        autoComplete="given-name"
                      />
                    </Field>
                    <Field id="alert-last-name" label="Last name optional" error={errors.last_name}>
                      <input
                        id="alert-last-name"
                        value={form.last_name}
                        onChange={(event) => updateField('last_name', event.target.value)}
                        className={inputClassName}
                        autoComplete="family-name"
                      />
                    </Field>
                  </div>
                  <Field id="alert-email" label="Email" error={errors.email}>
                    <input
                      id="alert-email"
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField('email', event.target.value)}
                      className={inputClassName}
                      autoComplete="email"
                    />
                  </Field>
                  <CheckboxField
                    id="alert-email-consent"
                    checked={form.email_consent}
                    onChange={(checked) => updateField('email_consent', checked)}
                    error={errors.email_consent}
                  >
                    I consent to receive email alerts for nearby lost and found pet reports.
                  </CheckboxField>
                </>
              ) : null}

              {step === 'location' ? (
                <AlertLocationStep form={form} errors={errors} updateField={updateField} />
              ) : null}

              {step === 'review' ? (
                <Card>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black text-slate-950">Review alert preference</h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setStep('contact')}>
                      Edit
                    </Button>
                  </div>
                  <dl className="mt-3 space-y-3">
                    {[
                      ['Name', `${form.first_name} ${form.last_name}`.trim()],
                      ['Email', form.email],
                      [
                        'Alert area',
                        form.location
                          ? `${form.location.label} near ${form.location.lat.toFixed(4)}, ${form.location.lng.toFixed(4)}`
                          : 'Not selected',
                      ],
                      ['Radius', `${form.radius_km} km`],
                      ['Email consent', form.email_consent ? 'Confirmed' : 'Not confirmed'],
                    ].map(([label, value]) => (
                      <div key={label} className="grid gap-1 border-t border-slate-100 pt-3 sm:grid-cols-[140px_1fr]">
                        <dt className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</dt>
                        <dd className="text-sm font-semibold leading-6 text-slate-700">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              ) : null}

              {submitError ? <ErrorState title="Alert preference not ready" description={submitError} /> : null}
            </div>
          )}
        </div>

        {!result ? (
          <div className="sticky bottom-0 border-t border-slate-200/70 bg-white/95 p-4 shadow-[0_-12px_30px_rgba(15,23,42,0.04)] backdrop-blur">
            <div className="mx-auto flex max-w-2xl gap-3">
              <Button type="button" variant="secondary" onClick={goBack} fullWidth disabled={isFirstStep || isSubmitting}>
                Back
              </Button>
              {isReviewStep ? (
                <Button type="button" onClick={submitSubscription} fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Preparing...' : 'Finish'}
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

function AlertProgress({
  steps,
  currentStep,
  onSelectStep,
}: {
  steps: typeof alertSteps
  currentStep: AlertFlowStep
  onSelectStep: (step: AlertFlowStep) => void
}) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <div className="pawlink-alert-progress">
      {steps.map((step, index) => {
        const isCurrent = step.id === currentStep
        const isComplete = index < currentIndex
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelectStep(step.id)}
            className="pawlink-alert-progress-step text-left focus:outline-none focus:ring-4 focus:ring-violet-100"
            data-current={isCurrent ? 'true' : undefined}
            data-complete={isComplete ? 'true' : undefined}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-violet-700 shadow-sm">
              {isComplete ? '✓' : index + 1}
            </span>
            <span className="mt-2 block text-xs font-black text-slate-950">{step.label}</span>
            <span className="mt-1 block text-[11px] leading-4 text-slate-500">{step.description}</span>
          </button>
        )
      })}
    </div>
  )
}
