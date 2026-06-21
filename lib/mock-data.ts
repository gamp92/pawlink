export type AnimalStatus = 'available' | 'in_process' | 'adopted'
export type Species = 'dog' | 'cat' | 'other'
export type ReportType = 'lost' | 'found'

export type Animal = {
  id: string
  name: string
  species: Species
  breed: string
  age_years: number
  size: 'small' | 'medium' | 'large'
  gender: 'female' | 'male'
  status: AnimalStatus
  color: string
  description: string
  energy_level: 'low' | 'medium' | 'high'
  good_with_kids: boolean
  good_with_pets: boolean
  photo_urls: string[]
  social_post: string | null
  shelter: {
    id: string
    name: string
    city: string
  }
  created_at: string
}

export type AdoptionRequest = {
  id: string
  status: 'pending' | 'seen' | 'approved' | 'rejected'
  compatibility_score: number
  compatibility_reasons: string[]
  animal: Pick<Animal, 'id' | 'name' | 'photo_urls'>
  family: {
    full_name: string
    email: string
    living_space: 'apartment' | 'house_no_yard' | 'house_yard'
    has_children: boolean
    has_other_pets: boolean
  }
  created_at: string
}

export type LostFoundReport = {
  id: string
  report_type: ReportType
  pet_name: string
  species: Species
  breed: string
  color: string
  description: string
  photo_urls: string[]
  location: {
    lat: number
    lng: number
  }
  location_notes: string
  city: string
  status: 'open' | 'resolved'
  matched_report_id: string | null
  match_confidence: number | null
  created_at: string
}

export type ShelterProfile = {
  id: string
  name: string
  description: string
  city: string
  cover_photo: string
  instagram_url: string
  stats: {
    total_animals: number
    available_animals: number
    total_adoptions: number
  }
}

export const shelterProfile: ShelterProfile = {
  id: 'shelter-patitas',
  name: 'Refugio Patitas',
  description: 'Small CDMX rescue focused on calm, transparent adoptions.',
  city: 'CDMX',
  cover_photo: '',
  instagram_url: 'https://instagram.com/refugiopatitas',
  stats: {
    total_animals: 23,
    available_animals: 18,
    total_adoptions: 142,
  },
}

export const animals: Animal[] = [
  {
    id: 'animal-luna',
    name: 'Luna',
    species: 'dog',
    breed: 'Golden mix',
    age_years: 2,
    size: 'medium',
    gender: 'female',
    status: 'available',
    color: 'golden',
    description: 'Calm, bright, and social with children.',
    energy_level: 'medium',
    good_with_kids: true,
    good_with_pets: true,
    photo_urls: [''],
    social_post: 'Meet Luna: 2 years old, golden mix, full of energy and love.',
    shelter: { id: shelterProfile.id, name: shelterProfile.name, city: shelterProfile.city },
    created_at: '2025-06-09T00:00:00Z',
  },
  {
    id: 'animal-mochi',
    name: 'Mochi',
    species: 'cat',
    breed: 'Siamese mix',
    age_years: 1,
    size: 'small',
    gender: 'male',
    status: 'in_process',
    color: 'cream',
    description: 'Gentle lap cat who prefers quiet apartments.',
    energy_level: 'low',
    good_with_kids: true,
    good_with_pets: false,
    photo_urls: [''],
    social_post: null,
    shelter: { id: shelterProfile.id, name: shelterProfile.name, city: shelterProfile.city },
    created_at: '2025-06-10T00:00:00Z',
  },
  {
    id: 'animal-bruno',
    name: 'Bruno',
    species: 'dog',
    breed: 'Labrador mix',
    age_years: 4,
    size: 'large',
    gender: 'male',
    status: 'available',
    color: 'black',
    description: 'Loyal, playful, and best with active adopters.',
    energy_level: 'high',
    good_with_kids: false,
    good_with_pets: true,
    photo_urls: [''],
    social_post: 'Bruno is ready for long walks and a family who loves adventure.',
    shelter: { id: shelterProfile.id, name: shelterProfile.name, city: shelterProfile.city },
    created_at: '2025-06-11T00:00:00Z',
  },
  {
    id: 'animal-nala',
    name: 'Nala',
    species: 'cat',
    breed: 'Mixed',
    age_years: 3,
    size: 'small',
    gender: 'female',
    status: 'available',
    color: 'orange',
    description: 'Independent and sweet once she trusts you.',
    energy_level: 'medium',
    good_with_kids: false,
    good_with_pets: true,
    photo_urls: [''],
    social_post: null,
    shelter: { id: shelterProfile.id, name: shelterProfile.name, city: shelterProfile.city },
    created_at: '2025-06-12T00:00:00Z',
  },
]

export const adoptionRequests: AdoptionRequest[] = [
  {
    id: 'request-luna-ana',
    status: 'pending',
    compatibility_score: 94.5,
    compatibility_reasons: ['Calm temperament', 'Good with children', 'Apartment friendly'],
    animal: {
      id: animals[0].id,
      name: animals[0].name,
      photo_urls: animals[0].photo_urls,
    },
    family: {
      full_name: 'Ana Garcia',
      email: 'ana@example.com',
      living_space: 'apartment',
      has_children: true,
      has_other_pets: false,
    },
    created_at: '2025-06-13T00:00:00Z',
  },
]

export const lostFoundReports: LostFoundReport[] = [
  {
    id: 'report-max-lost',
    report_type: 'lost',
    pet_name: 'Max',
    species: 'dog',
    breed: 'Golden Retriever',
    color: 'golden',
    description: 'Last seen near Parque Mexico with a red collar.',
    photo_urls: [''],
    location: { lat: 19.4129, lng: -99.1727 },
    location_notes: 'Near Parque Mexico, Condesa',
    city: 'CDMX',
    status: 'open',
    matched_report_id: 'report-unknown-found',
    match_confidence: 89.3,
    created_at: '2025-06-13T00:00:00Z',
  },
  {
    id: 'report-unknown-found',
    report_type: 'found',
    pet_name: 'Unknown dog',
    species: 'dog',
    breed: 'Golden mix',
    color: 'golden',
    description: 'Friendly dog found near Insurgentes.',
    photo_urls: [''],
    location: { lat: 19.4141, lng: -99.1704 },
    location_notes: 'Insurgentes Sur',
    city: 'CDMX',
    status: 'open',
    matched_report_id: 'report-max-lost',
    match_confidence: 89.3,
    created_at: '2025-06-13T03:00:00Z',
  },
  {
    id: 'report-coco-lost',
    report_type: 'lost',
    pet_name: 'Coco',
    species: 'cat',
    breed: 'Domestic short hair',
    color: 'orange',
    description: 'Shy cat, may hide near quiet patios.',
    photo_urls: [''],
    location: { lat: 19.4118, lng: -99.1742 },
    location_notes: 'Roma Norte',
    city: 'CDMX',
    status: 'open',
    matched_report_id: null,
    match_confidence: null,
    created_at: '2025-06-13T05:00:00Z',
  },
]

export const ragMessages = [
  {
    role: 'user',
    text: 'Can I adopt if I live in an apartment with two kids?',
  },
  {
    role: 'assistant',
    text: 'Yes, for animals under 15kg. What two children means is handled by a virtual interview before finalizing.',
    citation: 'politicas_adopcion.pdf - Section 3',
  },
  {
    role: 'user',
    text: 'Are they vaccinated?',
  },
  {
    role: 'assistant',
    text: 'All animals leave with full vaccines, rabies, distemper, parvovirus, and bordetella plus sterilization and a medical card.',
    citation: 'requisitos.pdf - Section 5',
  },
]

export const dashboardMetrics = [
  { label: 'Animals', value: '23', detail: '+4 added this week' },
  { label: 'Requests', value: '7', detail: '2 awaiting review' },
  { label: 'Adoptions', value: '11', detail: '+3 vs last month' },
]
