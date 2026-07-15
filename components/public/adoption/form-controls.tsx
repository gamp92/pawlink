import type { ReactNode } from 'react'

export const inputClassName =
  'public-input'

export const textareaClassName =
  'public-input public-textarea'

function choiceMeta(label: string, value: string) {
  const normalized = value.toLowerCase()
  const byValue: Record<string, { icon: string; description: string }> = {
    apartment: { icon: 'APT', description: 'Compact home or condo' },
    house: { icon: 'HOME', description: 'House with more room' },
    other: { icon: 'ALT', description: 'Another living setup' },
    own: { icon: 'OWN', description: 'You own the home' },
    rent: { icon: 'RENT', description: 'Rental or lease' },
    yes: { icon: 'YES', description: 'This applies to me' },
    no: { icon: 'NO', description: 'This does not apply' },
    low: { icon: 'LOW', description: 'Calm daily rhythm' },
    moderate: { icon: 'MOD', description: 'Balanced activity' },
    high: { icon: 'HIGH', description: 'Active lifestyle' },
    rarely: { icon: 'RARE', description: 'Mostly home' },
    sometimes: { icon: 'SOME', description: 'Occasional trips' },
    often: { icon: 'OFT', description: 'Frequent travel' },
    none: { icon: 'NEW', description: 'First-time adopter' },
    some: { icon: 'CARE', description: 'Some pet care' },
    experienced: { icon: 'PRO', description: 'Confident caregiver' },
  }

  return byValue[normalized] ?? {
    icon: label.slice(0, 3).toUpperCase(),
    description: 'Choose this option',
  }
}

function fieldHelper(label: string) {
  const normalized = label.toLowerCase()
  if (normalized.includes('optional')) return 'Optional'
  if (normalized.includes('email')) return 'Use an email you check often.'
  if (normalized.includes('phone')) return 'Optional, used only for follow-up.'
  if (normalized.includes('city')) return 'Helps the shelter understand distance.'
  if (normalized.includes('household')) return 'A simple estimate is fine.'
  if (normalized.includes('hours')) return 'Use a typical weekday.'
  if (normalized.includes('description') || normalized.includes('details')) return 'A few specific details are most helpful.'
  return 'Required information'
}

export function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="public-field" htmlFor={id}>
      <span className="public-field-label">{label}</span>
      {children}
      {error ? <span className="public-error">{error}</span> : <span className="public-helper">{fieldHelper(label)}</span>}
    </label>
  )
}

export function SegmentedControl<OptionValue extends string>({
  label,
  value,
  options,
  onChange,
  error,
}: {
  label: string
  value: OptionValue | ''
  options: Array<{ label: string; value: OptionValue }>
  onChange: (value: OptionValue) => void
  error?: string
}) {
  return (
    <div className="public-choice-group">
      <p className="public-choice-label">{label}</p>
      <div className="public-choice-grid sm:grid-cols-3">
        {options.map((option) => {
          const selected = value === option.value
          const meta = choiceMeta(option.label, option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className="public-radio-card"
              data-selected={selected}
            >
              <span className="public-radio-icon" aria-hidden="true">{meta.icon}</span>
              <span>
                <span className="public-radio-title">{option.label}</span>
                <span className="public-radio-description">{meta.description}</span>
              </span>
            </button>
          )
        })}
      </div>
      {error ? <p className="public-error">{error}</p> : null}
    </div>
  )
}

export function BooleanChoice({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  value: boolean | null
  onChange: (value: boolean) => void
  error?: string
}) {
  return (
    <SegmentedControl
      label={label}
      value={value === null ? '' : value ? 'yes' : 'no'}
      options={[
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ]}
      onChange={(nextValue) => onChange(nextValue === 'yes')}
      error={error}
    />
  )
}

export function CheckboxField({
  id,
  checked,
  onChange,
  children,
  error,
}: {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  error?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="public-checkbox-card">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="public-checkbox-input"
        />
        <span className="public-checkbox-switch" aria-hidden="true" />
        <span>{children}</span>
      </label>
      {error ? <p className="public-error">{error}</p> : null}
    </div>
  )
}
