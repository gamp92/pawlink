import type { Animal } from '@/lib/mock-data'
import { getAnimalDisplayImage } from '@/components/shared/pet-display-image'
import styles from './chat.module.css'

// Shape emitted by the RAG service's `animals` SSE event (pawlink-rag inventory handler).
// Deliberately narrower than lib/mock-data `Animal` — the service trims the payload.
export type ChatAnimal = {
  id: string
  name: string
  species: Animal['species']
  breed: string | null
  age_years: number | null
  size: Animal['size'] | null
  photo_urls: string[]
}

type AnimalChipsProps = {
  animals: ChatAnimal[]
  className?: string
}

function photoFor(animal: ChatAnimal) {
  // getAnimalDisplayImage only reads id/species/photo_urls, but its signature asks for a full
  // Animal. Cast at this boundary rather than widening the payload we ask the RAG service for.
  return getAnimalDisplayImage(animal as unknown as Animal)
}

function subtitleFor(animal: ChatAnimal) {
  const parts = [animal.breed, animal.age_years ? `${animal.age_years}a` : null]
  return parts.filter(Boolean).join(' · ')
}

export function AnimalChips({ animals, className = '' }: AnimalChipsProps) {
  if (animals.length === 0) return null

  return (
    <ul className={[styles.chipRow, className].filter(Boolean).join(' ')}>
      {animals.map((animal) => (
        <li key={animal.id} className={styles.chip}>
          {/* Plain <img>, not next/image: next.config.js declares no images.remotePatterns,
              so next/image would reject the Unsplash host at runtime. */}
          <img
            src={photoFor(animal)}
            alt={animal.name}
            className={styles.chipPhoto}
            loading="lazy"
            width={40}
            height={40}
          />
          <span className={styles.chipText}>
            <span className={styles.chipName}>{animal.name}</span>
            <span className={styles.chipMeta}>{subtitleFor(animal)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
