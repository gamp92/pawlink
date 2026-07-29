import Link from 'next/link'
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
  gender?: Animal['gender'] | null
  energy_level?: Animal['energy_level'] | null
  good_with_kids?: boolean | null
  good_with_pets?: boolean | null
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

const SIZE_LABELS: Record<NonNullable<ChatAnimal['size']>, string> = {
  small: 'Pequeño',
  medium: 'Mediano',
  large: 'Grande',
}

const GENDER_LABELS: Record<NonNullable<ChatAnimal['gender']>, string> = {
  female: 'Hembra',
  male: 'Macho',
}

const ENERGY_LABELS: Record<NonNullable<ChatAnimal['energy_level']>, string> = {
  low: 'Energía baja',
  medium: 'Energía media',
  high: 'Energía alta',
}

function traitsFor(animal: ChatAnimal) {
  const traits: string[] = []

  if (animal.breed) traits.push(animal.breed)
  if (animal.age_years != null) traits.push(`${animal.age_years} ${animal.age_years === 1 ? 'año' : 'años'}`)
  if (animal.size) traits.push(SIZE_LABELS[animal.size])
  if (animal.gender) traits.push(GENDER_LABELS[animal.gender])
  if (animal.energy_level) traits.push(ENERGY_LABELS[animal.energy_level])
  if (animal.good_with_kids) traits.push('Bueno con niños')
  if (animal.good_with_pets) traits.push('Bueno con otras mascotas')

  return traits
}

export function AnimalChips({ animals, className = '' }: AnimalChipsProps) {
  if (animals.length === 0) return null

  return (
    <ul className={[styles.chipRow, className].filter(Boolean).join(' ')}>
      {animals.map((animal) => {
        const traits = traitsFor(animal)

        return (
          <li key={animal.id} className={styles.chip}>
            <Link href={`/find-a-pet?animal=${animal.id}`} className={styles.chipLink}>
              {/* Plain <img>, not next/image: next.config.js declares no images.remotePatterns,
                  so next/image would reject the Unsplash host at runtime. */}
              <img
                src={photoFor(animal)}
                alt={animal.name}
                className={styles.chipPhoto}
                loading="lazy"
                width={160}
                height={120}
              />
              <span className={styles.chipText}>
                <span className={styles.chipName}>{animal.name}</span>
                {traits.length > 0 && (
                  <ul className={styles.chipTraits}>
                    {traits.map((trait) => (
                      <li key={trait} className={styles.chipTrait}>
                        {trait}
                      </li>
                    ))}
                  </ul>
                )}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
