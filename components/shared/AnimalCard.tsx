import type { Animal } from '@/lib/mock-data'
import { animalStatusTone, StatusBadge } from '@/components/shared/StatusBadge'

type AnimalCardProps = {
  animal: Animal
  compact?: boolean
  score?: number
  selected?: boolean
}

const speciesIcon: Record<Animal['species'], string> = {
  dog: 'Dog',
  cat: 'Cat',
  other: 'Pet',
}

export function AnimalCard({ animal, compact = false, score, selected = false }: AnimalCardProps) {
  return (
    <article
      className={`group overflow-hidden rounded-[1.35rem] border bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
        selected ? 'border-violet-400 ring-4 ring-violet-100' : 'border-slate-200 hover:border-violet-200'
      }`}
    >
      <div className={`${compact ? 'h-44' : 'h-48'} relative grid place-items-center overflow-hidden bg-gradient-to-br from-violet-100 via-white to-teal-100`}>
        <div className="absolute inset-x-8 bottom-[-34px] h-24 rounded-full bg-white/70 blur-2xl" />
        <div className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur">
          {speciesIcon[animal.species]}
        </div>
        <button
          type="button"
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/90 text-sm font-black text-violet-700 shadow-sm transition group-hover:scale-105"
          aria-label={`Save ${animal.name}`}
        >
          ♡
        </button>
        <div className="absolute bottom-3 right-3 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[11px] font-black text-slate-700 shadow-sm">
          {animal.energy_level} energy
        </div>
        {score ? (
          <div className="absolute bottom-3 left-3 rounded-full bg-violet-600 px-3 py-1 text-xs font-black text-white shadow-lg shadow-violet-200">
            {score}% match
          </div>
        ) : null}
        <div className="grid h-20 w-20 place-items-center rounded-[1.75rem] bg-white/80 text-5xl font-black text-violet-700 shadow-sm backdrop-blur transition group-hover:scale-105">
          {animal.name.slice(0, 1)}
        </div>
      </div>

      <div className="p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="truncate text-lg font-black tracking-tight text-slate-950">{animal.name}</h3>
              <div className="mt-1 flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-violet-100 text-[9px] font-black text-violet-700">
                  {animal.shelter.name.slice(0, 1)}
                </span>
                <p className="truncate text-xs font-semibold text-slate-500">{animal.shelter.name}</p>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {animal.breed} - {animal.age_years} years - {animal.size}
              </p>
            </div>
            <StatusBadge
              label={animal.status.replace('_', ' ')}
              tone={animalStatusTone(animal.status)}
            />
          </div>
          {score ? (
            <div className="mt-3">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-teal-500 transition-all duration-700" style={{ width: `${score}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{animal.size}</span>
                <span className="rounded-full bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700">{animal.good_with_pets ? 'Pet friendly' : 'Solo home'}</span>
              </div>
            </div>
          ) : (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{animal.description}</p>
          )}
        </div>
      </div>
    </article>
  )
}
