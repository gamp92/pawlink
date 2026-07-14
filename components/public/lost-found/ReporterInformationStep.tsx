import {
  CheckboxField,
  Field,
  inputClassName,
} from '@/components/public/lost-found/form-controls'
import type { LostFoundReportForm } from '@/components/public/lost-found/types'

type Props = {
  form: LostFoundReportForm
  errors: Partial<Record<keyof LostFoundReportForm, string>>
  updateField: <FieldName extends keyof LostFoundReportForm>(
    field: FieldName,
    value: LostFoundReportForm[FieldName],
  ) => void
}

export function ReporterInformationStep({ form, errors, updateField }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="reporter-first-name" label="First name" error={errors.first_name}>
          <input
            id="reporter-first-name"
            value={form.first_name}
            onChange={(event) => updateField('first_name', event.target.value)}
            className={inputClassName}
            autoComplete="given-name"
          />
        </Field>
        <Field id="reporter-last-name" label="Last name" error={errors.last_name}>
          <input
            id="reporter-last-name"
            value={form.last_name}
            onChange={(event) => updateField('last_name', event.target.value)}
            className={inputClassName}
            autoComplete="family-name"
          />
        </Field>
      </div>

      <Field id="reporter-email" label="Email" error={errors.email}>
        <input
          id="reporter-email"
          type="email"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          className={inputClassName}
          autoComplete="email"
        />
      </Field>

      <Field id="reporter-phone" label="Phone optional" error={errors.phone}>
        <input
          id="reporter-phone"
          value={form.phone}
          onChange={(event) => updateField('phone', event.target.value)}
          className={inputClassName}
          autoComplete="tel"
        />
      </Field>

      <CheckboxField
        id="reporter-contact-consent"
        checked={form.contact_consent}
        onChange={(checked) => updateField('contact_consent', checked)}
        error={errors.contact_consent}
      >
        I consent to be contacted by email about this report.
      </CheckboxField>
    </div>
  )
}
