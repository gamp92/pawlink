'use client'

import type { ReactNode } from 'react'
import { Badge } from '@/components/shared/Badge'
import { useShelterWorkspace } from '@/components/shelter/ShelterWorkspaceContext'

type ShelterHubLayoutProps = {
  active: 'Dashboard' | 'Animals' | 'Requests' | 'Documents'
  title: string
  subtitle: string
  action?: ReactNode
  children: ReactNode
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', shortLabel: 'Home' },
  { label: 'Animals', href: '/dashboard/animals', shortLabel: 'Pets' },
  { label: 'Requests', href: '/dashboard/requests', shortLabel: 'Inbox' },
  { label: 'Documents', href: '/dashboard/documents', shortLabel: 'Docs' },
] as const

export function ShelterHubLayout({ active, title, subtitle, action, children }: ShelterHubLayoutProps) {
  const { shelterName, userEmail } = useShelterWorkspace()
  const initials = shelterName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-4 md:self-start">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-teal-50 p-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 text-xs font-black text-white shadow-sm">
              {initials}
            </div>
            <p className="mt-3 text-sm font-black tracking-tight text-slate-950">{shelterName}</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-500">{userEmail}</p>
          </div>

          <nav className="mt-3 hidden space-y-2 md:block">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-3 text-sm font-bold transition ${
                  active === item.label ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-3 hidden rounded-xl border border-slate-200 bg-slate-50 p-3 md:block">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Plan</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700">Demo workspace</span>
              <Badge tone="teal">Active</Badge>
            </div>
          </div>
        </div>

        <nav className="mt-3 overflow-x-auto pb-2 md:hidden">
          <div className="flex gap-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black shadow-sm ${
                  active === item.label
                    ? 'border-violet-600 bg-violet-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {item.shortLabel}
              </a>
            ))}
          </div>
        </nav>
      </aside>

      <section className="min-w-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600">Shelter Hub</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
          <div className="mt-5">{children}</div>
        </div>
      </section>
    </div>
  )
}
