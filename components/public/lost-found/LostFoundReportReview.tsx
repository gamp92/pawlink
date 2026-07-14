import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import type {
  LostFoundFlowStep,
  LostFoundReportForm,
} from '@/components/public/lost-found/types'

type ReviewSection = {
  title: string
  step: LostFoundFlowStep
  rows: Array<[string, string]>
}

export function LostFoundReportReview({
  form,
  onEdit,
}: {
  form: LostFoundReportForm
  onEdit: (step: LostFoundFlowStep) => void
}) {
  const sections: ReviewSection[] = [
    {
      title: 'Reporter',
      step: 'reporter',
      rows: [
        ['Name', `${form.first_name} ${form.last_name}`],
        ['Email', form.email],
        ['Phone', form.phone || 'Not provided'],
        ['Contact consent', form.contact_consent ? 'Confirmed' : 'Not confirmed'],
      ],
    },
    {
      title: 'Pet and incident',
      step: 'pet',
      rows: [
        ['Report type', form.report_type],
        ['Pet name', form.pet_name || 'Not provided'],
        ['Species', form.species || 'Not answered'],
        ['Breed', form.breed || 'Not provided'],
        ['Color', form.color],
        ['Size', form.size || 'Not answered'],
        ['Sex', form.sex || 'Not provided'],
        ['Date', form.date_lost_or_seen],
        ['Description', form.description],
      ],
    },
    {
      title: 'Location',
      step: 'location',
      rows: [
        ['Description', form.location_notes],
        [
          'Selected area',
          form.location
            ? `${form.location.label} near ${form.location.lat.toFixed(4)}, ${form.location.lng.toFixed(4)}`
            : 'Not selected',
        ],
      ],
    },
    {
      title: 'Photos',
      step: 'photos',
      rows: [
        ['Selected images', form.photos.length ? `${form.photos.length} image${form.photos.length === 1 ? '' : 's'}` : 'None'],
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
          Reports work best when contact information, location, and photos are accurate. Review carefully before continuing.
        </p>
      </Card>
    </div>
  )
}
