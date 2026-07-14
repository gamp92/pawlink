import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { SelectedPetSummary } from '@/components/public/adoption/SelectedPetSummary'
import type {
  AdoptionApplicationForm,
  AdoptionApplicationStep,
  SelectedAdoptionMatch,
} from '@/components/public/adoption/types'

type ReviewSection = {
  title: string
  step: AdoptionApplicationStep
  rows: Array<[string, string]>
}

function yesNo(value: boolean | null) {
  if (value === null) return 'Not answered'
  return value ? 'Yes' : 'No'
}

export function ApplicationReviewStep({
  form,
  match,
  onEdit,
}: {
  form: AdoptionApplicationForm
  match: SelectedAdoptionMatch
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
        ['City', form.city],
      ],
    },
    {
      title: 'Home and household',
      step: 'household',
      rows: [
        ['Living space', form.living_space || 'Not answered'],
        ['Own or rent', form.own_or_rent || 'Not answered'],
        ['Landlord allows pets', form.own_or_rent === 'rent' ? yesNo(form.landlord_allows_pets) : 'Not applicable'],
        ['Household size', form.household_size],
        ['Children', yesNo(form.has_children)],
        ['Children ages', form.children_ages || 'Not provided'],
        ['Other pets', yesNo(form.has_other_pets)],
        ['Other pets details', form.other_pets_details || 'Not provided'],
      ],
    },
    {
      title: 'Lifestyle',
      step: 'lifestyle',
      rows: [
        ['Activity level', form.activity_level || 'Not answered'],
        ['Hours alone', `${form.hours_pet_alone} hours`],
        ['Care time', form.care_time],
        ['Travel frequency', form.travel_frequency || 'Not answered'],
        ['Pet experience', form.previous_pet_experience || 'Not answered'],
      ],
    },
    {
      title: 'Adoption intent',
      step: 'intent',
      rows: [
        ['Motivation', form.adoption_motivation],
        ['Preferred characteristics', form.preferred_characteristics],
        ['Can cover costs', form.can_cover_costs ? 'Yes' : 'No'],
        ['Shelter interview', form.willing_to_interview ? 'Yes' : 'No'],
        ['Truthful information', form.truthful_information_confirmed ? 'Confirmed' : 'Not confirmed'],
        ['Email contact consent', form.contact_consent ? 'Confirmed' : 'Not confirmed'],
      ],
    },
  ]

  return (
    <div className="space-y-4">
      <SelectedPetSummary match={match} />
      {sections.map((section) => (
        <Card key={section.title} className="rounded-[1.5rem]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-50 text-sm font-black text-violet-700">
                {section.title.slice(0, 1)}
              </span>
              <h3 className="text-base font-black text-slate-950">{section.title}</h3>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(section.step)}>
              Edit
            </Button>
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
          This starts a shelter review. The shelter will contact the applicant by email after reviewing the information.
        </p>
      </Card>
    </div>
  )
}
