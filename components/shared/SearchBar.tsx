type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <label className="block">
      <span className="sr-only">{placeholder}</span>
      <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
        <span className="text-sm font-black text-violet-700">/</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold text-slate-950 outline-none"
        />
      </div>
    </label>
  )
}
