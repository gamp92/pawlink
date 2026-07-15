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
              aria-pressed={isActive}
              className={`ds-chip ${isActive ? 'ds-chip-active' : ''}`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
