'use client'

import { useState } from 'react'
import { AdoptionIntentStep } from '@/components/public/adoption/AdoptionIntentStep'
import { ApplicationReviewStep } from '@/components/public/adoption/ApplicationReviewStep'
import { ApplicationSuccess } from '@/components/public/adoption/ApplicationSuccess'
import { ContactInformationStep } from '@/components/public/adoption/ContactInformationStep'
import { HouseholdStep } from '@/components/public/adoption/HouseholdStep'
import { LifestyleStep } from '@/components/public/adoption/LifestyleStep'
import {
  adoptionApplicationSteps,
  QuestionnaireProgress,
} from '@/components/public/adoption/QuestionnaireProgress'
import { SelectedPetSummary } from '@/components/public/adoption/SelectedPetSummary'
import { submitAnonymousAdoptionApplication } from '@/components/public/adoption/adoption-application-adapter'
import { Button } from '@/components/shared/Button'
import { ErrorState } from '@/components/shared/ErrorState'
import type {
  AdoptionApplicationForm,
  AdoptionApplicationResult,
  AdoptionApplicationStep,
  AnonymousAdoptionApplicationPayload,
  SelectedAdoptionMatch,
} from '@/components/public/adoption/types'
import { initialAdoptionApplicationForm } from '@/components/public/adoption/types'

const stepTitles: Record<AdoptionApplicationStep, string> = {
  contact: 'Contact information',
  household: 'Home and household',
  lifestyle: 'Lifestyle',
  intent: 'Adoption intent',
  review: 'Review application',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AdoptionApplicationFlow({
  match,
  open,
  onClose,
}: {
  match: SelectedAdoptionMatch | null
  open: boolean
  onClose: () => void
}) {
  const [step, setStep] = useState<AdoptionApplicationStep>('contact')
  const [form, setForm] = useState<AdoptionApplicationForm>(initialAdoptionApplicationForm)
  const [errors, setErrors] = useState<Partial<Record<keyof AdoptionApplicationForm, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<AdoptionApplicationResult | null>(null)

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
      if (!form.city.trim()) nextErrors.city = 'City is required.'
    }

    if (targetStep === 'household') {
      if (!form.living_space) nextErrors.living_space = 'Choose a living space.'
      if (!form.own_or_rent) nextErrors.own_or_rent = 'Choose own or rent.'
      if (form.own_or_rent === 'rent' && form.landlord_allows_pets === null) {
        nextErrors.landlord_allows_pets = 'Confirm whether pets are allowed.'
      }
      const householdSize = Number(form.household_size)
      if (!form.household_size.trim() || !Number.isFinite(householdSize) || householdSize < 1) {
        nextErrors.household_size = 'Enter a household size of at least 1.'
      }
      if (form.has_children === null) nextErrors.has_children = 'Choose yes or no.'
      if (form.has_other_pets === null) nextErrors.has_other_pets = 'Choose yes or no.'
    }

    if (targetStep === 'lifestyle') {
      if (!form.activity_level) nextErrors.activity_level = 'Choose an activity level.'
      const hoursAlone = Number(form.hours_pet_alone)
      if (!form.hours_pet_alone.trim() || !Number.isFinite(hoursAlone) || hoursAlone < 0 || hoursAlone > 24) {
        nextErrors.hours_pet_alone = 'Enter a value between 0 and 24.'
      }
      if (!form.care_time.trim()) nextErrors.care_time = 'Describe available care time.'
      if (!form.travel_frequency) nextErrors.travel_frequency = 'Choose a travel frequency.'
      if (!form.previous_pet_experience) nextErrors.previous_pet_experience = 'Choose your pet experience.'
    }

    if (targetStep === 'intent') {
      if (!form.adoption_motivation.trim()) nextErrors.adoption_motivation = 'Tell the shelter why you want to adopt.'
      if (!form.preferred_characteristics.trim()) {
        nextErrors.preferred_characteristics = 'Share what you are looking for in a pet.'
      }
      if (!form.can_cover_costs) nextErrors.can_cover_costs = 'This confirmation is required.'
      if (!form.willing_to_interview) nextErrors.willing_to_interview = 'This confirmation is required.'
      if (!form.truthful_information_confirmed) {
        nextErrors.truthful_information_confirmed = 'This confirmation is required.'
      }
      if (!form.contact_consent) nextErrors.contact_consent = 'Consent to email contact is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateThroughReview() {
    const stepsToValidate: AdoptionApplicationStep[] = ['contact', 'household', 'lifestyle', 'intent']
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
    if (!form.living_space || !form.own_or_rent || form.has_children === null || form.has_other_pets === null) return null
    if (!form.activity_level || !form.travel_frequency || !form.previous_pet_experience) return null

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
        city: form.city.trim(),
      },
      household: {
        living_space: form.living_space,
        own_or_rent: form.own_or_rent,
        landlord_allows_pets: form.own_or_rent === 'rent' ? form.landlord_allows_pets : null,
        household_size: Number(form.household_size),
        has_children: form.has_children,
        children_ages: form.children_ages.trim() || undefined,
        has_other_pets: form.has_other_pets,
        other_pets_details: form.other_pets_details.trim() || undefined,
      },
      lifestyle: {
        activity_level: form.activity_level,
        hours_pet_alone: Number(form.hours_pet_alone),
        care_time: form.care_time.trim(),
        travel_frequency: form.travel_frequency,
        previous_pet_experience: form.previous_pet_experience,
      },
      adoption_intent: {
        adoption_motivation: form.adoption_motivation.trim(),
        preferred_characteristics: form.preferred_characteristics.trim(),
        can_cover_costs: form.can_cover_costs,
        willing_to_interview: form.willing_to_interview,
      },
      consents: {
        truthful_information_confirmed: form.truthful_information_confirmed,
        contact_consent: form.contact_consent,
      },
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

  const stepProps = { form, errors, updateField }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 md:grid md:place-items-center md:bg-slate-950/50 md:p-6">
      <section className="flex h-full flex-col bg-slate-50 md:h-auto md:max-h-[92vh] md:w-full md:max-w-4xl md:overflow-hidden md:rounded-[2rem] md:border md:border-white/70 md:bg-white md:shadow-2xl">
        <div className="border-b border-slate-200/70 bg-white/90 p-4 backdrop-blur md:p-5">
          <div className="mx-auto flex max-w-3xl items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-violet-600">Adoption application</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                {result ? 'Application received' : stepTitles[step]}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {result
                  ? 'The shelter will review your information and contact you by email.'
                  : 'This request starts a shelter review. It is not an automatic adoption approval.'}
              </p>
            </div>
            <button
              type="button"
              onClick={closeAndReset}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-sm font-black text-slate-500 shadow-sm transition hover:border-violet-200 hover:text-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-100"
              aria-label="Close adoption application"
            >
              x
            </button>
          </div>
          {!result ? (
            <div className="mx-auto mt-4 max-w-3xl">
              <QuestionnaireProgress currentStep={step} onSelectStep={setStep} />
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {result ? (
            <div className="mx-auto max-w-2xl">
              <ApplicationSuccess match={activeMatch} result={result} onClose={closeAndReset} />
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-4 transition duration-300">
              <SelectedPetSummary match={activeMatch} compact={step !== 'review'} />
              {step === 'contact' ? <ContactInformationStep {...stepProps} /> : null}
              {step === 'household' ? <HouseholdStep {...stepProps} /> : null}
              {step === 'lifestyle' ? <LifestyleStep {...stepProps} /> : null}
              {step === 'intent' ? <AdoptionIntentStep {...stepProps} /> : null}
              {step === 'review' ? (
                <ApplicationReviewStep form={form} match={activeMatch} onEdit={setStep} />
              ) : null}
              {submitError ? <ErrorState title="Application not sent" description={submitError} /> : null}
            </div>
          )}
        </div>

        {!result ? (
          <div className="border-t border-slate-200/70 bg-white/95 p-4 shadow-[0_-12px_30px_rgba(15,23,42,0.04)] backdrop-blur">
            <div className="mx-auto flex max-w-3xl gap-3">
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
