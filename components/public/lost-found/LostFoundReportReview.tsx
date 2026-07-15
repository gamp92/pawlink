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

function compactRows(rows: Array<[string, string | undefined | null]>) {
  return rows.filter(([, value]) => Boolean(value?.trim())) as Array<[string, string]>
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
      title: 'Pet and incident',
      step: 'pet',
      rows: compactRows([
        ['Report type', form.report_type],
        ['Pet name', form.pet_name],
        ['Species', form.species],
        ['Breed', form.breed],
        ['Color', form.color],
        ['Description', form.description],
      ]),
    },
    {
      title: 'Location',
      step: 'location',
      rows: compactRows([
        ['Description', form.location_notes],
        ['City', form.city],
        [
          'Selected area',
          form.location
            ? `${form.location.label} near ${form.location.lat.toFixed(4)}, ${form.location.lng.toFixed(4)}`
            : undefined,
        ],
      ]),
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
          Reports work best when the description and map pin are accurate. Review carefully before continuing.
        </p>
      </Card>
    </div>
  )
}
