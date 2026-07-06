import type { ReactNode } from 'react'

type DashboardCardProps = {
  children: ReactNode
  className?: string
  interactive?: boolean
}

export function DashboardCard({ children, className = '', interactive = false }: DashboardCardProps) {
  return (
    <section
      className={[
        'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm',
        interactive ? 'transition hover:-translate-y-0.5 hover:shadow-lg' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </section>
  )
}
