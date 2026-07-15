import type { ReactNode } from 'react'

type BadgeProps = {
  children: ReactNode
  tone?: 'violet' | 'teal' | 'rose' | 'amber' | 'green' | 'slate'
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  violet: 'ds-badge-violet',
  teal: 'ds-badge-teal',
  rose: 'ds-badge-rose',
  amber: 'ds-badge-amber',
  green: 'ds-badge-green',
  slate: 'ds-badge-slate',
}

export function Badge({ children, tone = 'slate' }: BadgeProps) {
  return (
    <span className={`ds-badge ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}
