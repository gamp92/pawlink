import type React from 'react'
import type { Animal } from '@/lib/mock-data'
import { getAnimalDisplayImage } from '@/components/shared/pet-display-image'

type AnimalCardProps = {
  animal: Animal
  compact?: boolean
  score?: number
  selected?: boolean
  favorite?: boolean
  onSelect?: () => void
  onFavorite?: () => void
}

const speciesIcon: Record<Animal['species'], string> = {
  dog: 'Dog',
  cat: 'Cat',
  other: 'Pet',
}

export function AnimalCard({
  animal,
  compact = false,
  score,
  selected = false,
  favorite = false,
  onSelect,
  onFavorite,
}: AnimalCardProps) {
  const isInteractive = Boolean(onSelect)

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (!onSelect || event.currentTarget !== event.target) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect()
    }
  }

  function handleFavoriteClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onFavorite?.()
  }

  const traits = [
    animal.energy_level ? `${animal.energy_level[0].toUpperCase()}${animal.energy_level.slice(1)} energy` : null,
    animal.good_with_kids ? 'Kid friendly' : null,
    animal.good_with_pets ? 'Pet friendly' : 'Solo home',
  ].filter(Boolean).slice(0, 3)
  const imageUrl = getAnimalDisplayImage(animal)

  return (
    <article
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? `Select ${animal.name}` : undefined}
      aria-pressed={isInteractive ? selected : undefined}
      data-selected={selected ? 'true' : undefined}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={`group overflow-hidden rounded-[1.5rem] border bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 ${
        isInteractive ? 'cursor-pointer' : ''
      } ${
        selected ? 'border-violet-500 ring-4 ring-violet-100' : 'border-slate-200 hover:border-violet-200'
      }`}
    >
      <div className="pawlink-photo-frame" style={{ aspectRatio: compact ? '4 / 3' : '16 / 10' }}>
        <img src={imageUrl} alt={`${animal.name}, ${animal.breed} available for adoption`} className="pawlink-pet-photo" />
        <div className="absolute left-3 top-3 z-10 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-sm backdrop-blur">
          {speciesIcon[animal.species]}
        </div>
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/80 bg-white/90 text-base font-black text-violet-700 shadow-sm transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-100"
          aria-label={`Save ${animal.name}`}
          aria-pressed={favorite}
        >
          ♡
        </button>
        {score ? (
          <div className="absolute bottom-3 left-3 z-10 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-violet-200">
            {score}% match
          </div>
        ) : null}
      </div>

      <div className="p-4 md:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-xl font-black tracking-tight text-slate-950">{animal.name}</h3>
              <div className="mt-2 flex min-w-0 items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-100 text-[10px] font-black text-violet-700">
                  {animal.shelter.name.slice(0, 1)}
                </span>
                <p className="truncate text-sm font-semibold text-slate-500">{animal.shelter.name}</p>
              </div>
            </div>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-500">
              {animal.status.replace('_', ' ')}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            {animal.breed} · {animal.age_years} years · {animal.size}
          </p>
          {score ? (
            <div className="mt-3">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-teal-500 transition-all duration-700" style={{ width: `${score}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {traits.map((trait) => (
                  <span key={trait} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {trait}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs font-bold text-violet-700">View profile</p>
            </div>
          ) : (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{animal.description}</p>
          )}
        </div>
      </div>
    </article>
  )
}
