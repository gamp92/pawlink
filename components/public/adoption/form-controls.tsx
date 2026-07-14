import type { ReactNode } from 'react'

export const inputClassName =
  'mt-1 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100'

export const textareaClassName =
  'mt-1 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100'

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
    <label className="block" htmlFor={id}>
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-bold text-rose-600">{error}</span> : null}
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
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-12 rounded-2xl border px-3 text-sm font-black transition ${
              value === option.value
                ? 'border-violet-300 bg-violet-50 text-violet-700'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-1 text-xs font-bold text-rose-600">{error}</p> : null}
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
      <label
        htmlFor={id}
        className="flex min-h-14 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-700"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-4 w-4 accent-violet-600"
        />
        <span>{children}</span>
      </label>
      {error ? <p className="mt-1 text-xs font-bold text-rose-600">{error}</p> : null}
    </div>
  )
}
