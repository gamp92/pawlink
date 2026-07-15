import type { ReactNode } from 'react'
import { MobileBottomNav } from '@/components/shared/MobileBottomNav'
import { PageHeader } from '@/components/shared/PageHeader'

type AppShellProps = {
  title: string
  subtitle: string
  children: ReactNode
  activeHref?: string
}

const primaryShelterHref = '/shelter/7a2f59a5-7d2f-477c-b11d-fe7c98d7aa30'

const publicNavItems = [
  { label: 'Home', href: '/', shortLabel: 'H' },
  { label: 'Adopt', href: '/find-a-pet', shortLabel: 'A' },
  { label: 'Lost', href: '/lost-found', shortLabel: 'L' },
  { label: 'Shelter', href: primaryShelterHref, shortLabel: 'S' },
]

function inferActiveHref(title: string, activeHref?: string) {
  if (activeHref) return activeHref
  if (title.toLowerCase().includes('adoption')) return '/find-a-pet'
  if (title.toLowerCase().includes('lost')) return '/lost-found'
  if (title.toLowerCase().includes('shelter')) return primaryShelterHref
  return '/'
}

export function AppShell({ title, subtitle, children, activeHref }: AppShellProps) {
  const currentHref = inferActiveHref(title, activeHref)

  return (
    <div className="min-h-screen bg-slate-100 pb-20 md:pb-6">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2 text-sm font-black text-violet-700">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600 text-xs font-black text-white">
              PL
            </span>
            <span>Pawlink</span>
          </a>

          <nav className="hidden items-center gap-2 md:flex">
            {publicNavItems.map((item) => {
              const isActive = currentHref === item.href
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`ds-chip min-h-0 px-3 py-2 ${
                    isActive
                      ? 'ds-chip-active'
                      : ''
                  }`}
                >
                  {item.label}
                </a>
              )
            })}
            <a href="/login" className="ds-button ds-button-secondary ds-button-sm">
              Login
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4 md:p-6">
        <section className="ds-card overflow-hidden">
          <div className="border-b border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 md:p-6">
            <PageHeader eyebrow="Pawlink" title={title} subtitle={subtitle} />
          </div>
          <div className="p-4 md:p-6">{children}</div>
        </section>
      </main>

      <MobileBottomNav items={publicNavItems} activeHref={currentHref} />
    </div>
  )
}
