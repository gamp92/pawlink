import type { ReactNode } from 'react'

export const inputClassName =
  'mt-2 h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-950 shadow-sm outline-none transition placeholder:text-slate-300 hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50 disabled:text-slate-400'

export const textareaClassName =
  'mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] font-semibold leading-6 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-300 hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100'

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
      <span className="text-sm font-bold text-slate-700">{label}</span>
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
    <div>
      <p className="text-sm font-bold text-slate-700">{label}</p>
      <div className={`mt-2 grid gap-2 ${columns}`}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-12 rounded-xl border px-3 text-sm font-black shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-violet-100 ${
              value === option.value
                ? 'border-violet-500 bg-violet-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200'
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
        className="flex min-h-14 items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-700 shadow-sm transition hover:border-violet-200"
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
