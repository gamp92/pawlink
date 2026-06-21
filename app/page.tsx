const routes = [
  {
    title: 'Shelter Hub',
    description: 'Private dashboard for animals, requests, and documents.',
    href: '/dashboard',
    accent: 'bg-teal-600',
  },
  {
    title: 'Smart Adoption',
    description: 'Public pet gallery with mock compatibility matching.',
    href: '/find-a-pet',
    accent: 'bg-violet-600',
  },
  {
    title: 'Lost & Found',
    description: 'Map-style report board with mock geo-alert and vision states.',
    href: '/lost-found',
    accent: 'bg-rose-600',
  },
  {
    title: 'Shelter Assistant',
    description: 'Public shelter profile with a mock RAG chat experience.',
    href: '/shelter/shelter-patitas',
    accent: 'bg-slate-800',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide text-violet-600">Pawlink</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Frontend routes</h1>
          <p className="mt-3 text-sm text-slate-500">
            Mock-data pages for the shelter dashboard, adoption flow, lost and found board, and shelter assistant.
          </p>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {routes.map((route) => (
              <a
                key={route.href}
                href={route.href}
                className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-sm"
              >
                <div className={`h-1.5 ${route.accent}`} />
                <div className="p-4">
                  <h2 className="text-lg font-black tracking-tight text-slate-950">{route.title}</h2>
                  <p className="mt-2 text-sm leading-5 text-slate-500">{route.description}</p>
                  <p className="mt-3 text-xs font-bold text-violet-700">{route.href}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
