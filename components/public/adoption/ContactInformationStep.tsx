import {
  Field,
  inputClassName,
} from '@/components/public/adoption/form-controls'
import type { AdoptionStepProps } from '@/components/public/adoption/types'

export function ContactInformationStep({ form, errors, updateField }: AdoptionStepProps) {
  return (
    <div className="public-form-stack">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="first-name" label="First name" error={errors.first_name}>
          <input
            id="first-name"
            value={form.first_name}
            onChange={(event) => updateField('first_name', event.target.value)}
            className={inputClassName}
            autoComplete="given-name"
          />
        </Field>
        <Field id="last-name" label="Last name" error={errors.last_name}>
          <input
            id="last-name"
            value={form.last_name}
            onChange={(event) => updateField('last_name', event.target.value)}
            className={inputClassName}
            autoComplete="family-name"
          />
        </Field>
      </div>

      <Field id="email" label="Email" error={errors.email}>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          className={inputClassName}
          autoComplete="email"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="phone" label="Phone optional" error={errors.phone}>
          <input
            id="phone"
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            className={inputClassName}
            autoComplete="tel"
          />
        </Field>
        <Field id="city" label="City" error={errors.city}>
          <input
            id="city"
            value={form.city}
            onChange={(event) => updateField('city', event.target.value)}
            className={inputClassName}
            autoComplete="address-level2"
          />
        </Field>
      </div>
    </div>
  )
}
