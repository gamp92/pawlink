import { AnimalCard } from '@/components/shared/AnimalCard'
import { adoptionRequests, animals } from '@/lib/mock-data'

const matchScores: Record<string, number> = {
  'animal-luna': 94,
  'animal-mochi': 78,
  'animal-bruno': 61,
  'animal-nala': 45,
}

export function SmartAdoption() {
  const featuredRequest = adoptionRequests[0]

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_170px]">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">Find your match</h2>
            <p className="mt-1 text-xs text-slate-500">Answer profile questions and compare mock compatibility.</p>
          </div>
          <p className="text-[11px] text-slate-400">47 animals available</p>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {['All', 'Dogs', 'Cats', 'Kid friendly', 'Apartment'].map((filter, index) => (
            <span
              key={filter}
              className={`rounded-full border px-3 py-1 text-[11px] ${
                index === 0
                  ? 'border-violet-300 bg-violet-50 text-violet-700'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              {filter}
            </span>
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {animals.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} compact score={matchScores[animal.id]} />
          ))}
        </div>
      </div>

      <aside className="rounded-lg border border-slate-200 bg-white p-3">
        <h3 className="text-sm font-bold">Your profile</h3>
        {[
          ['Living space', 'Apartment'],
          ['Children', 'Yes, 2 kids'],
          ['Other pets', 'None'],
        ].map(([label, value]) => (
          <div key={label} className="mt-3">
            <p className="text-[11px] font-medium text-slate-500">{label}</p>
            <div className="mt-1 rounded border border-violet-200 bg-violet-50 px-2 py-1 text-center text-xs text-violet-700">
              {value}
            </div>
          </div>
        ))}

        <div className="mt-4 rounded-lg bg-violet-100 p-4 text-center text-violet-900">
          <p className="text-3xl font-black">{Math.round(featuredRequest.compatibility_score)}%</p>
          <p className="text-[11px] font-semibold">match with Luna</p>
          <ul className="mt-2 text-left text-[11px] leading-5">
            {featuredRequest.compatibility_reasons.map((reason) => (
              <li key={reason}>- {reason}</li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
