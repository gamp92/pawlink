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
        'ds-card ds-card-pad-md',
        interactive ? 'ds-card-interactive' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </section>
  )
}
