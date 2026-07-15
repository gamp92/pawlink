import { Field, inputClassName } from '@/components/public/lost-found/form-controls'
import { MapLocationPicker } from '@/components/public/lost-found/MapLocationPicker'
import type { LostFoundReportForm } from '@/components/public/lost-found/types'

type Props = {
  form: LostFoundReportForm
  errors: Partial<Record<keyof LostFoundReportForm, string>>
  updateField: <FieldName extends keyof LostFoundReportForm>(
    field: FieldName,
    value: LostFoundReportForm[FieldName],
  ) => void
}

export function ReportLocationStep({ form, errors, updateField }: Props) {
  return (
    <div className="public-form-stack">
      <Field id="location-notes" label="Location description" error={errors.location_notes}>
        <input
          id="location-notes"
          value={form.location_notes}
          onChange={(event) => updateField('location_notes', event.target.value)}
          className={inputClassName}
          placeholder="Near Parque Mexico, main entrance, corner store..."
        />
      </Field>
      <Field id="report-city" label="City optional" error={errors.city}>
        <input
          id="report-city"
          value={form.city}
          onChange={(event) => updateField('city', event.target.value)}
          className={inputClassName}
          placeholder="Ciudad de Mexico, Quito, Medellin..."
        />
      </Field>
      <MapLocationPicker
        value={form.location}
        onChange={(location) => updateField('location', location)}
        error={errors.location}
        label="Pin the location"
      />
    </div>
  )
}
