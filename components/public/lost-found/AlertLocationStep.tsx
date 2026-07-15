import { Field, inputClassName } from '@/components/public/lost-found/form-controls'
import { MapLocationPicker } from '@/components/public/lost-found/MapLocationPicker'
import type { AlertSubscriptionForm } from '@/components/public/lost-found/types'

type Props = {
  form: AlertSubscriptionForm
  errors: Partial<Record<keyof AlertSubscriptionForm, string>>
  updateField: <FieldName extends keyof AlertSubscriptionForm>(
    field: FieldName,
    value: AlertSubscriptionForm[FieldName],
  ) => void
}

export function AlertLocationStep({ form, errors, updateField }: Props) {
  return (
    <div className="public-form-stack">
      <MapLocationPicker
        value={form.location}
        onChange={(location) => updateField('location', location)}
        error={errors.location}
        label="Alert center"
      />
      <Field id="alert-radius" label="Alert radius in kilometers" error={errors.radius_km}>
        <input
          id="alert-radius"
          type="number"
          min="0.5"
          max="20"
          step="0.5"
          value={form.radius_km}
          onChange={(event) => updateField('radius_km', event.target.value)}
          className={inputClassName}
        />
      </Field>
    </div>
  )
}
