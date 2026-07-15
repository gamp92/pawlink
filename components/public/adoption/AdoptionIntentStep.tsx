import {
  CheckboxField,
  Field,
  textareaClassName,
} from '@/components/public/adoption/form-controls'
import type { AdoptionStepProps } from '@/components/public/adoption/types'

export function AdoptionIntentStep({ form, errors, updateField }: AdoptionStepProps) {
  return (
    <div className="public-form-stack">
      <Field id="motivation" label="Why do you want to adopt?" error={errors.adoption_motivation}>
        <textarea
          id="motivation"
          value={form.adoption_motivation}
          onChange={(event) => updateField('adoption_motivation', event.target.value)}
          className={textareaClassName}
        />
      </Field>

      <Field id="characteristics" label="Preferred animal characteristics" error={errors.preferred_characteristics}>
        <textarea
          id="characteristics"
          value={form.preferred_characteristics}
          onChange={(event) => updateField('preferred_characteristics', event.target.value)}
          className={textareaClassName}
          placeholder="Energy level, temperament, size, or compatibility needs."
        />
      </Field>

      <CheckboxField
        id="cover-costs"
        checked={form.can_cover_costs}
        onChange={(checked) => updateField('can_cover_costs', checked)}
        error={errors.can_cover_costs}
      >
        I am willing and able to cover food and veterinary costs.
      </CheckboxField>

      <CheckboxField
        id="shelter-interview"
        checked={form.willing_to_interview}
        onChange={(checked) => updateField('willing_to_interview', checked)}
        error={errors.willing_to_interview}
      >
        I am willing to complete a shelter interview before adoption.
      </CheckboxField>

      <CheckboxField
        id="truthful"
        checked={form.truthful_information_confirmed}
        onChange={(checked) => updateField('truthful_information_confirmed', checked)}
        error={errors.truthful_information_confirmed}
      >
        I confirm the information I provided is truthful.
      </CheckboxField>

      <CheckboxField
        id="contact-consent"
        checked={form.contact_consent}
        onChange={(checked) => updateField('contact_consent', checked)}
        error={errors.contact_consent}
      >
        I consent to be contacted by email about this application.
      </CheckboxField>
    </div>
  )
}
