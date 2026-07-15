import { Button } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { MobileBottomNav } from '@/components/shared/MobileBottomNav'
import { PageHeader } from '@/components/shared/PageHeader'

const primaryShelterHref = '/shelter/7a2f59a5-7d2f-477c-b11d-fe7c98d7aa30'

const navItems = [
  { label: 'Home', href: '/', shortLabel: 'H' },
  { label: 'Adopt', href: '/find-a-pet', shortLabel: 'A' },
  { label: 'Lost', href: '/lost-found', shortLabel: 'L' },
  { label: 'Shelter', href: primaryShelterHref, shortLabel: 'S' },
]

const featureCards = [
  {
    title: 'Find a pet',
    description: 'Answer a few questions and discover pets that match your home, routine, and care style.',
    href: '/find-a-pet',
    label: 'Start matching',
    tone: 'accent' as const,
  },
  {
    title: 'Lost & Found',
    description: 'Browse local reports, submit a sighting, and help reunite pets with nearby families.',
    href: '/lost-found',
    label: 'Open reports',
    tone: 'default' as const,
  },
  {
    title: 'Shelter profile',
    description: 'See shelter information, documents, and a guided assistant experience for adopters.',
    href: primaryShelterHref,
    label: 'Visit shelter',
    tone: 'default' as const,
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-100 pb-20 text-slate-950 md:pb-6">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2 text-sm font-black text-violet-700">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600 text-xs font-black text-white">
              PL
            </span>
            <span>Pawlink</span>
          </a>
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.slice(1).map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500"
              >
                {item.label}
              </a>
            ))}
            <a href="/login" className="rounded-full bg-slate-950 px-3 py-2 text-xs font-bold text-white">
              Shelter login
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 md:p-6">
        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="bg-gradient-to-br from-white to-teal-50 p-5 md:p-8">
            <PageHeader
              eyebrow="Shelter care, adoption, and recovery"
              title="A calmer way to connect pets with the right people."
              subtitle="Pawlink helps shelters manage animals and requests while giving families a simple mobile-first way to adopt, report, and ask questions."
            />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button href="/find-a-pet" size="lg">
                Find a pet
              </Button>
              <Button href="/lost-found" variant="secondary" size="lg">
                Report lost pet
              </Button>
            </div>
          </Card>

          <Card className="p-5 md:p-8">
            <p className="text-[11px] font-bold uppercase tracking-wide text-teal-700">Shelter dashboard</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Operations stay organized.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Private shelter tools keep animals, requests, and documents in one focused workspace.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ['23', 'Animals'],
                ['7', 'Requests'],
                ['142', 'Adoptions'],
                ['3', 'Docs'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-2xl font-black text-slate-950">{value}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">{label}</p>
                </div>
              ))}
            </div>
            <Button href="/login" className="mt-5" variant="secondary" fullWidth>
              Shelter login
            </Button>
          </Card>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          {featureCards.map((feature) => (
            <Card key={feature.href} tone={feature.tone}>
              <h2 className="text-lg font-black tracking-tight text-slate-950">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
              <Button href={feature.href} variant="ghost" className="mt-4 px-0 shadow-sm">
                {feature.label}
              </Button>
            </Card>
          ))}
        </section>
      </div>

      <MobileBottomNav items={navItems} activeHref="/" />
    </main>
  )
}
