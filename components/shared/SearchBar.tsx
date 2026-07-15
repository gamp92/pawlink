type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <label className="block">
      <span className="sr-only">{placeholder}</span>
      <div className="ds-input-shell gap-2 px-4">
        <span className="text-sm font-black text-violet-700">/</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="ds-input flex-1 text-sm font-semibold"
        />
      </div>
    </label>
  )
}
