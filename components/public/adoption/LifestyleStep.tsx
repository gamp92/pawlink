import {
  Field,
  inputClassName,
  SegmentedControl,
  textareaClassName,
} from '@/components/public/adoption/form-controls'
import type {
  ActivityLevel,
  AdoptionStepProps,
  PetExperience,
  TravelFrequency,
} from '@/components/public/adoption/types'

export function LifestyleStep({ form, errors, updateField }: AdoptionStepProps) {
  return (
    <div className="space-y-4">
      <SegmentedControl<ActivityLevel>
        label="Activity level"
        value={form.activity_level}
        options={[
          { label: 'Low', value: 'low' },
          { label: 'Moderate', value: 'moderate' },
          { label: 'High', value: 'high' },
        ]}
        onChange={(value) => updateField('activity_level', value)}
        error={errors.activity_level}
      />

      <Field id="hours-alone" label="Hours pet will be alone each day" error={errors.hours_pet_alone}>
        <input
          id="hours-alone"
          type="number"
          min="0"
          max="24"
          value={form.hours_pet_alone}
          onChange={(event) => updateField('hours_pet_alone', event.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field id="care-time" label="Available time for walks and care" error={errors.care_time}>
        <textarea
          id="care-time"
          value={form.care_time}
          onChange={(event) => updateField('care_time', event.target.value)}
          className={textareaClassName}
          placeholder="Example: 45 minutes in the morning and another walk after work."
        />
      </Field>

      <SegmentedControl<TravelFrequency>
        label="Travel frequency"
        value={form.travel_frequency}
        options={[
          { label: 'Rarely', value: 'rarely' },
          { label: 'Sometimes', value: 'sometimes' },
          { label: 'Often', value: 'often' },
        ]}
        onChange={(value) => updateField('travel_frequency', value)}
        error={errors.travel_frequency}
      />

      <SegmentedControl<PetExperience>
        label="Previous pet experience"
        value={form.previous_pet_experience}
        options={[
          { label: 'First pet', value: 'none' },
          { label: 'Some care', value: 'some' },
          { label: 'Experienced', value: 'experienced' },
        ]}
        onChange={(value) => updateField('previous_pet_experience', value)}
        error={errors.previous_pet_experience}
      />
    </div>
  )
}
