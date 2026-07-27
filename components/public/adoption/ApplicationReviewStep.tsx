import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import type {
  AdoptionFamilyProfile,
  AdoptionApplicationForm,
  AdoptionApplicationStep,
} from '@/components/public/adoption/types'

type ReviewSection = {
  title: string
  step: AdoptionApplicationStep
  rows: Array<[string, string]>
}

const livingSpaceLabels: Record<AdoptionFamilyProfile['living_space'], string> = {
  apartment: 'Apartment',
  house_no_yard: 'House',
  house_yard: 'House with yard',
}

const lifestyleLabels: Record<AdoptionFamilyProfile['lifestyle'], string> = {
  sedentary: 'Calm routine',
  moderate: 'Moderate activity',
  active: 'Active lifestyle',
}

const experienceLabels: Record<AdoptionFamilyProfile['experience'], string> = {
  none: 'First-time adopter',
  some: 'Some pet experience',
  experienced: 'Experienced pet caregiver',
}

function yesNo(value: boolean) {
  return value ? 'Yes' : 'No'
}

export function ApplicationReviewStep({
  form,
  familyProfile,
  onEdit,
}: {
  form: AdoptionApplicationForm
  familyProfile: AdoptionFamilyProfile
  onEdit: (step: AdoptionApplicationStep) => void
}) {
  const sections: ReviewSection[] = [
    {
      title: 'Applicant',
      step: 'contact',
      rows: [
        ['Name', `${form.first_name} ${form.last_name}`],
        ['Email', form.email],
        ['Phone', form.phone || 'Not provided'],
      ],
    },
    {
      title: 'Match profile used',
      step: 'contact',
      rows: [
        ['Living space', livingSpaceLabels[familyProfile.living_space]],
        ['Routine', lifestyleLabels[familyProfile.lifestyle]],
        ['Experience', experienceLabels[familyProfile.experience]],
        ['Children at home', yesNo(familyProfile.has_children)],
        ['Other pets', yesNo(familyProfile.has_other_pets)],
      ],
    },
  ]

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Card key={section.title} className="rounded-[1.5rem]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-sm font-black text-violet-700">
                {section.title.slice(0, 1)}
              </span>
              <h3 className="text-base font-black text-slate-950">{section.title}</h3>
            </div>
            {section.title === 'Applicant' ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(section.step)}>
                Edit
              </Button>
            ) : null}
          </div>
          <dl className="mt-3 space-y-3">
            {section.rows.map(([label, value]) => (
              <div key={label} className="grid gap-1 border-t border-slate-100 pt-3 sm:grid-cols-[150px_1fr]">
                <dt className="text-xs font-bold text-slate-400">{label}</dt>
                <dd className="text-sm font-semibold leading-6 text-slate-700">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ))}
      <Card className="rounded-[1.5rem] border-amber-200 bg-amber-50">
        <p className="text-sm font-black text-amber-800">Before submitting</p>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          This starts a shelter review. The shelter receives your contact details, selected pet, match score, and the profile already used for matching.
        </p>
      </Card>
    </div>
  )
}
