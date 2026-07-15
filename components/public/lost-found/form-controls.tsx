import type { ReactNode } from 'react'

export const inputClassName =
  'public-input'

export const textareaClassName =
  'public-input public-textarea'

function choiceMeta(label: string, value: string) {
  const normalized = value.toLowerCase()
  const byValue: Record<string, { icon: string; description: string }> = {
    lost: { icon: 'LOST', description: 'My pet is missing' },
    found: { icon: 'FIND', description: 'I found a pet' },
    dog: { icon: 'DOG', description: 'Canine report' },
    cat: { icon: 'CAT', description: 'Feline report' },
    other: { icon: 'PET', description: 'Another species' },
    small: { icon: 'S', description: 'Easy to carry' },
    medium: { icon: 'M', description: 'Medium build' },
    large: { icon: 'L', description: 'Large build' },
    female: { icon: 'F', description: 'Female pet' },
    male: { icon: 'M', description: 'Male pet' },
    unknown: { icon: '?', description: 'Not sure yet' },
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
  if (normalized.includes('location')) return 'Use a landmark or nearby intersection.'
  if (normalized.includes('color')) return 'Include markings if you can.'
  if (normalized.includes('date')) return 'Choose the day the pet was lost or seen.'
  if (normalized.includes('description')) return 'Add safe approach notes, collar, or behavior.'
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
  columns = 'sm:grid-cols-3',
}: {
  label: string
  value: OptionValue | ''
  options: Array<{ label: string; value: OptionValue }>
  onChange: (value: OptionValue) => void
  error?: string
  columns?: string
}) {
  return (
    <div className="public-choice-group">
      <p className="public-choice-label">{label}</p>
      <div className={`public-choice-grid ${columns}`}>
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
