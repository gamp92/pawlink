import type { ReactNode } from 'react'

type BadgeProps = {
  children: ReactNode
  tone?: 'violet' | 'teal' | 'rose' | 'amber' | 'green' | 'slate'
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
  teal: 'border-teal-200 bg-teal-50 text-teal-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
}

export function Badge({ children, tone = 'slate' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold leading-none ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}
