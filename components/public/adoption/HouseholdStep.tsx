import {
  BooleanChoice,
  Field,
  inputClassName,
  SegmentedControl,
  textareaClassName,
} from '@/components/public/adoption/form-controls'
import type { AdoptionStepProps, LivingSpace, OwnRent } from '@/components/public/adoption/types'

export function HouseholdStep({ form, errors, updateField }: AdoptionStepProps) {
  return (
    <div className="public-form-stack">
      <SegmentedControl<LivingSpace>
        label="Living space"
        value={form.living_space}
        options={[
          { label: 'Apartment', value: 'apartment' },
          { label: 'House', value: 'house' },
          { label: 'Other', value: 'other' },
        ]}
        onChange={(value) => updateField('living_space', value)}
        error={errors.living_space}
      />

      <SegmentedControl<OwnRent>
        label="Do you own or rent?"
        value={form.own_or_rent}
        options={[
          { label: 'Own', value: 'own' },
          { label: 'Rent', value: 'rent' },
        ]}
        onChange={(value) => updateField('own_or_rent', value)}
        error={errors.own_or_rent}
      />

      {form.own_or_rent === 'rent' ? (
        <BooleanChoice
          label="Does your landlord allow pets?"
          value={form.landlord_allows_pets}
          onChange={(value) => updateField('landlord_allows_pets', value)}
          error={errors.landlord_allows_pets}
        />
      ) : null}

      <Field id="household-size" label="Household size" error={errors.household_size}>
        <input
          id="household-size"
          type="number"
          min="1"
          value={form.household_size}
          onChange={(event) => updateField('household_size', event.target.value)}
          className={inputClassName}
        />
      </Field>

      <BooleanChoice
        label="Are there children at home?"
        value={form.has_children}
        onChange={(value) => updateField('has_children', value)}
        error={errors.has_children}
      />

      {form.has_children ? (
        <Field id="children-ages" label="Children ages optional" error={errors.children_ages}>
          <input
            id="children-ages"
            value={form.children_ages}
            onChange={(event) => updateField('children_ages', event.target.value)}
            className={inputClassName}
            placeholder="Example: 4 and 9"
          />
        </Field>
      ) : null}

      <BooleanChoice
        label="Do you have other pets?"
        value={form.has_other_pets}
        onChange={(value) => updateField('has_other_pets', value)}
        error={errors.has_other_pets}
      />

      {form.has_other_pets ? (
        <Field id="other-pets" label="Other pets details optional" error={errors.other_pets_details}>
          <textarea
            id="other-pets"
            value={form.other_pets_details}
            onChange={(event) => updateField('other_pets_details', event.target.value)}
            className={textareaClassName}
            placeholder="Species, ages, temperament, and whether they live indoors."
          />
        </Field>
      ) : null}
    </div>
  )
}
