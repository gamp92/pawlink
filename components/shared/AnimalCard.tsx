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
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
        selected ? 'border-violet-300' : 'border-slate-200'
      }`}
    >
      <div className={`${compact ? 'h-36' : 'h-40'} relative grid place-items-center bg-gradient-to-br from-violet-50 to-teal-50`}>
        <div className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-sm">
          {speciesIcon[animal.species]}
        </div>
        <div className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-white/60 bg-white/90 text-sm font-black text-violet-700 shadow-sm">
          +
        </div>
        {score ? (
          <div className="absolute bottom-3 left-3 rounded-full bg-violet-600 px-3 py-1 text-xs font-black text-white shadow-sm">
            {score}% match
          </div>
        ) : null}
        <div className="text-4xl font-black text-violet-700">{animal.name.slice(0, 1)}</div>
      </div>

      <div className="p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="truncate text-lg font-black tracking-tight text-slate-950">{animal.name}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">{animal.shelter.name}</p>
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
            <div className="mt-2">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-violet-600" style={{ width: `${score}%` }} />
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
