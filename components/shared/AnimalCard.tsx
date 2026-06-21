import type { Animal } from '@/lib/mock-data'
import { animalStatusTone, StatusBadge } from '@/components/shared/StatusBadge'

type AnimalCardProps = {
  animal: Animal
  compact?: boolean
  score?: number
}

const speciesIcon: Record<Animal['species'], string> = {
  dog: 'dog',
  cat: 'cat',
  other: 'pet',
}

export function AnimalCard({ animal, compact = false, score }: AnimalCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 p-3">
        <div
          className={`grid shrink-0 place-items-center rounded-md ${
            compact ? 'h-10 w-10 text-lg' : 'h-20 w-20 text-2xl'
          } bg-gradient-to-br from-violet-50 to-teal-50 text-slate-700`}
          aria-hidden="true"
        >
          {speciesIcon[animal.species]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="truncate text-sm font-bold text-slate-950">{animal.name}</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {animal.breed} - {animal.age_years}y - {animal.gender[0].toUpperCase()}
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
              <p className="mt-1 text-[11px] font-semibold text-violet-700">{score}% compatible</p>
            </div>
          ) : (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{animal.description}</p>
          )}
        </div>
      </div>
    </article>
  )
}
