import type { Animal, LostFoundReport, Species } from '@/lib/mock-data'

const dogDemoImages = [
  'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&q=80',
]

const catDemoImages = [
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80',
]

const otherDemoImages = [
  'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=900&q=80',
]

function imagePoolForSpecies(species: Species) {
  if (species === 'dog') return dogDemoImages
  if (species === 'cat') return catDemoImages
  return otherDemoImages
}

function indexForId(id: string, total: number) {
  const value = Array.from(id).reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return value % total
}

function fallbackImageFor(species: Species, id: string) {
  const pool = imagePoolForSpecies(species)
  return pool[indexForId(id, pool.length)]
}

// Visual demo fallback only. Real API-provided photo_urls always win and nothing is persisted.
export function getAnimalDisplayImage(animal: Animal) {
  return animal.photo_urls[0] ?? fallbackImageFor(animal.species, animal.id)
}

// Visual demo fallback only. Real API-provided photo_urls always win and nothing is persisted.
export function getPetDisplayImage(report: LostFoundReport) {
  return report.photo_urls[0] ?? fallbackImageFor(report.species, report.id)
}
