import { PetPhotoUploader } from '@/components/public/lost-found/PetPhotoUploader'
import type { LostFoundReportForm } from '@/components/public/lost-found/types'

type Props = {
  form: LostFoundReportForm
  updateField: <FieldName extends keyof LostFoundReportForm>(
    field: FieldName,
    value: LostFoundReportForm[FieldName],
  ) => void
}

export function ReportPhotosStep({ form, updateField }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-black text-slate-950">Pet images</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Photos help shelters and neighbors recognize the pet quickly.
        </p>
      </div>
      <PetPhotoUploader photos={form.photos} onChange={(photos) => updateField('photos', photos)} />
    </div>
  )
}
