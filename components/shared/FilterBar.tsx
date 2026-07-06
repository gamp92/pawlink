type FilterOption<TValue extends string> = {
  label: string
  value: TValue
}

type FilterBarProps<TValue extends string> = {
  options: FilterOption<TValue>[]
  value: TValue
  onChange: (value: TValue) => void
}

export function FilterBar<TValue extends string>({ options, value, onChange }: FilterBarProps<TValue>) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-2">
        {options.map((option) => {
          const isActive = option.value === value
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={`h-11 shrink-0 rounded-full border px-4 text-xs font-black transition ${
                isActive
                  ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
