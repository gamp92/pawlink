import type { ReactNode } from 'react'

type ShelterHubLayoutProps = {
  active: 'Dashboard' | 'Animals' | 'Requests' | 'Documents'
  children: ReactNode
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Animals', href: '/dashboard/animals' },
  { label: 'Requests', href: '/dashboard/requests' },
  { label: 'Documents', href: '/dashboard/documents' },
] as const

export function ShelterHubLayout({ active, children }: ShelterHubLayoutProps) {
  return (
    <div className="grid gap-4 md:grid-cols-[150px_1fr]">
      <aside className="rounded-lg border border-slate-200 bg-white p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Refugio Patitas
        </p>
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`mt-2 block rounded px-2 py-1.5 text-xs font-medium ${
              active === item.label ? 'bg-violet-100 text-violet-700' : 'text-slate-500'
            }`}
          >
            {item.label}
          </a>
        ))}
      </aside>
      <div>{children}</div>
    </div>
  )
}
